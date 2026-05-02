const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const { jwtSecret } = require("../config");
const { User } = require("../models/User");
const { Profile } = require("../models/Profile");

const authRouter = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, jwtSecret, { expiresIn: "7d" });
}

function newEmailVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashToken(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(80),
      email: z.string().email().max(120),
      password: z.string().min(6).max(200),
      role: z.enum(["student", "admin"]).optional(),
    });
    const input = schema.parse(req.body);

    const exists = await User.findOne({ email: input.email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role || "student",
      isEmailVerified: true,
    });

    await Profile.create({ userId: user._id });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      needsEmailVerification: false,
      isProfileIncomplete: true,
    });
  } catch (err) {
    next(err);
  }
});



authRouter.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const input = schema.parse(req.body);

    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });



    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const profile = await Profile.findOne({ userId: user._id });
    const isProfileIncomplete = !profile
      ? true
      : !String(profile.department || "").trim() &&
        !String(profile.bio || "").trim() &&
        !(profile.skills && profile.skills.length);

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      isProfileIncomplete,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/google", async (req, res, next) => {
  try {
    const email = "google-demo@student.unilink.edu";
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      user = await User.create({
        name: "Google Student",
        email,
        passwordHash,
        role: "student",
        isEmailVerified: true,
      });
      await Profile.create({ userId: user._id });
    }
    const profile = await Profile.findOne({ userId: user._id });
    const isProfileIncomplete = !profile
      ? true
      : !String(profile.department || "").trim() &&
        !String(profile.bio || "").trim() &&
        !(profile.skills && profile.skills.length);
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      isProfileIncomplete,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const input = schema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      return res.json({ ok: true, message: "If that email exists, reset instructions were sent." });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    user.resetPasswordToken = rawToken;
    user.resetPasswordExpires = expires;
    await user.save();
    res.json({
      ok: true,
      message: "Use the reset token below (demo mode — in production this would be emailed).",
      resetToken: rawToken,
      expiresAt: expires.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const schema = z.object({
      token: z.string().min(10),
      password: z.string().min(6).max(200),
    });
    const input = schema.parse(req.body);
    const user = await User.findOne({
      resetPasswordToken: input.token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });
    user.passwordHash = await bcrypt.hash(input.password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ ok: true, message: "Password updated. You can log in now." });
  } catch (err) {
    next(err);
  }
});

module.exports = { authRouter };

