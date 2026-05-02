const express = require("express");
const mongoose = require("mongoose");

const { verifyToken, checkRole } = require("../middleware/auth");
const { User } = require("../models/User");
const { Post } = require("../models/Post");
const { Event } = require("../models/Event");
const { Group } = require("../models/Group");

const adminRouter = express.Router();

adminRouter.use(verifyToken, checkRole("admin"));

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const [totalUsers, totalEvents, pendingEvents, totalGroups] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: "pending" }),
      Group.countDocuments()
    ]);
    res.json({
      totalUsers,
      totalEvents,
      pendingEvents,
      totalGroups,
      totalReports: 0,
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/users/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId).select("_id role");
    if (!user) return res.status(404).json({ error: "Not found" });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot delete admin user" });

    await Post.deleteMany({ userId });
    await Event.updateMany({}, { $pull: { registrations: { userId } } });
    await Event.deleteMany({ createdBy: userId });
    await User.deleteOne({ _id: userId });

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/posts", async (_req, res, next) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const userIds = [...new Set(posts.map((p) => String(p.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select("_id name");
    const nameById = new Map(users.map((u) => [String(u._id), u.name]));

    res.json({
      posts: posts.map((p) => ({
        ...p,
        authorName: nameById.get(String(p.userId)) || "Unknown",
      })),
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/posts/:postId", async (req, res, next) => {
  try {
    const postId = req.params.postId;
    if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ error: "Invalid postId" });
    const post = await Post.findByIdAndDelete(postId);
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/events", async (_req, res, next) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ date: 1 })
      .limit(200)
      .lean();
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/events/:id/approve", async (req, res, next) => {
  try {
    const eventId = req.params.id;
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ error: "Invalid eventId" });
    const event = await Event.findByIdAndUpdate(eventId, { $set: { status: "approved" } }, { new: true });
    if (!event) return res.status(404).json({ error: "Not found" });
    res.json({ event });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/events/:id/reject", async (req, res, next) => {
  try {
    const eventId = req.params.id;
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ error: "Invalid eventId" });
    const event = await Event.findByIdAndUpdate(eventId, { $set: { status: "rejected" } }, { new: true });
    if (!event) return res.status(404).json({ error: "Not found" });
    res.json({ event });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/reports", async (_req, res) => {
  res.json({ reports: [] });
});

adminRouter.get("/groups", async (_req, res, next) => {
  try {
    const groups = await Group.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/groups/:groupId", async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    if (!mongoose.isValidObjectId(groupId)) return res.status(400).json({ error: "Invalid groupId" });
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = { adminRouter };

