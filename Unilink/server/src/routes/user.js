const express = require("express");
const { z } = require("zod");
const { verifyToken } = require("../middleware/auth");
const { Profile } = require("../models/Profile");
const { User } = require("../models/User");

const userRouter = express.Router();

userRouter.get("/profile", verifyToken, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id }) || {};
    res.json({
      name: req.user.name,
      role: req.user.role,
      age: profile.age || "",
      college: profile.collegeName || "",
      department: profile.department || "",
      graduation_year: profile.graduationYear || "",
      year: profile.year || "",
      bio: profile.bio || "",
      skills: profile.skills || [],
      interests: profile.interests || [],
      achievements: profile.achievements || [],
      certifications: profile.certifications || [],
      contactEmail: profile.contactEmail || "",
      contactPhone: profile.contactPhone || "",
      collegeLocation: profile.collegeLocation || ""
    });
  } catch (err) {
    next(err);
  }
});

userRouter.put("/profile", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(80).optional(),
      age: z.union([z.string(), z.number()]).optional(),
      college: z.string().max(120).optional(),
      collegeLocation: z.string().max(120).optional(),
      graduation_year: z.union([z.string(), z.number()]).optional(),
      department: z.string().max(120).optional(),
      year: z.string().max(60).optional(),
      bio: z.string().max(500).optional(),
      skills: z.union([z.array(z.string().max(40)).max(40), z.string()]).optional(),
      interests: z.union([z.array(z.string().max(40)).max(40), z.string()]).optional(),
      achievements: z.union([z.array(z.string().max(120)).max(50), z.string()]).optional(),
      certifications: z.union([z.array(z.string().max(120)).max(50), z.string()]).optional(),
      contactEmail: z.string().email().max(120).optional().or(z.literal("")),
      contactPhone: z.string().max(40).optional(),
    });
    const input = schema.parse(req.body);

    if (input.name !== undefined) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: { name: input.name } },
        { new: true }
      );
    }
    
    const profileData = {
      ...(input.age !== undefined && { age: String(input.age) }),
      ...(input.college !== undefined && { collegeName: input.college }),
      ...(input.collegeLocation !== undefined && { collegeLocation: input.collegeLocation }),
      ...(input.graduation_year !== undefined && { graduationYear: String(input.graduation_year) }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.skills !== undefined && { skills: Array.isArray(input.skills) ? input.skills : input.skills.split(",").map(s=>s.trim()).filter(Boolean) }),
      ...(input.interests !== undefined && { interests: Array.isArray(input.interests) ? input.interests : input.interests.split(",").map(s=>s.trim()).filter(Boolean) }),
      ...(input.achievements !== undefined && { achievements: Array.isArray(input.achievements) ? input.achievements : input.achievements.split(",").map(s=>s.trim()).filter(Boolean) }),
      ...(input.certifications !== undefined && { certifications: Array.isArray(input.certifications) ? input.certifications : input.certifications.split(",").map(s=>s.trim()).filter(Boolean) }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail }),
      ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone })
    };

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileData },
      { new: true, upsert: true }
    );

    const updatedUser = await User.findById(req.user._id);

    res.json({
      name: updatedUser.name,
      role: updatedUser.role,
      age: profile.age,
      college: profile.collegeName,
      department: profile.department,
      graduation_year: profile.graduationYear,
      year: profile.year,
      bio: profile.bio,
      skills: profile.skills,
      interests: profile.interests,
      achievements: profile.achievements,
      certifications: profile.certifications,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
      collegeLocation: profile.collegeLocation
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { userRouter };
