const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const { verifyToken } = require("../middleware/auth");
const { Profile } = require("../models/Profile");
const { User } = require("../models/User");
const { ConnectionRequest } = require("../models/ConnectionRequest");

const profilesRouter = express.Router();

profilesRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const department = String(req.query.department || "").trim();
    const skill = String(req.query.skill || "").trim();
    const interest = String(req.query.interest || "").trim();

    const accepted = await ConnectionRequest.find({
      status: "accepted",
      $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }],
    })
      .select("fromUserId toUserId")
      .lean();

    const connectedIds = accepted.map((r) =>
      String(r.fromUserId) === String(req.user._id) ? r.toUserId : r.fromUserId,
    );

    const userFilter = {
      _id: {
        $nin: [req.user._id, ...connectedIds],
      },
    };
    if (q) userFilter.name = { $regex: q, $options: "i" };

    const users = await User.find(userFilter)
      .select("_id name email role")
      .limit(30);

    const userIds = users.map((u) => u._id);

    const profileFilter = { userId: { $in: userIds } };
    if (department) profileFilter.department = { $regex: department, $options: "i" };
    if (skill) profileFilter.skills = { $in: [skill] };
    if (interest) profileFilter.interests = { $in: [interest] };

    const profiles = await Profile.find(profileFilter).lean();
    const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

    const results = users
      .map((u) => ({
        user: { id: u._id, name: u.name, email: u.email, role: u.role },
        profile: profileByUserId.get(String(u._id)) || null,
      }))
      .filter((x) => x.profile);

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

profilesRouter.get("/:userId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId).select("_id name email role");
    if (!user) return res.status(404).json({ error: "Not found" });

    const profile = await Profile.findOne({ userId });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

profilesRouter.put("/me", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({
      age: z.string().max(10).optional(),
      collegeName: z.string().max(120).optional(),
      collegeLocation: z.string().max(120).optional(),
      graduationYear: z.string().max(20).optional(),
      department: z.string().max(120).optional(),
      year: z.string().max(60).optional(),
      bio: z.string().max(500).optional(),
      skills: z.array(z.string().max(40)).max(40).optional(),
      interests: z.array(z.string().max(40)).max(40).optional(),
      achievements: z.array(z.string().max(120)).max(50).optional(),
      certifications: z.array(z.string().max(120)).max(50).optional(),
      contactEmail: z.string().email().max(120).optional().or(z.literal("")),
      contactPhone: z.string().max(40).optional(),
    });
    const input = schema.parse(req.body);

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: input },
      { new: true, upsert: true },
    );

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

module.exports = { profilesRouter };

