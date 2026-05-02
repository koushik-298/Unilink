const express = require("express");
const { z } = require("zod");

const { verifyToken } = require("../middleware/auth");
const { Post } = require("../models/Post");
const { User } = require("../models/User");

const postsRouter = express.Router();

postsRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const userIds = [...new Set(posts.map((p) => String(p.userId)))];
    const users = await User.find({ _id: { $in: userIds } }).select("_id name");
    const nameById = new Map(users.map((u) => [String(u._id), u.name]));

    res.json({
      posts: posts.map((p) => ({
        ...p,
        authorName: nameById.get(String(p.userId)) || "Unknown",
        likeCount: p.likes?.length || 0,
        commentCount: p.comments?.length || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({
      content: z.string().min(1).max(2000),
      imageUrl: z.string().url().optional().or(z.literal("")),
    });
    const input = schema.parse(req.body);

    const post = await Post.create({
      userId: req.user._id,
      content: input.content,
      imageUrl: input.imageUrl || "",
    });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/:postId/like", verifyToken, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Not found" });

    const me = String(req.user._id);
    const has = post.likes.some((id) => String(id) === me);
    if (has) {
      post.likes = post.likes.filter((id) => String(id) !== me);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    res.json({ liked: !has, likeCount: post.likes.length });
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/:postId/report", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({ reason: z.string().max(300).optional() });
    const input = schema.parse(req.body);
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Not found" });
    const me = String(req.user._id);
    const alreadyReported = post.reports.some((r) => String(r.userId) === me);
    if (alreadyReported) return res.status(409).json({ error: "Already reported" });
    post.reports.push({ userId: req.user._id, reason: input.reason || "" });
    await post.save();
    res.json({ reported: true, reportCount: post.reports.length });
  } catch (err) {
    next(err);
  }
});

postsRouter.post("/:postId/comments", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({ text: z.string().min(1).max(500) });
    const input = schema.parse(req.body);

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Not found" });

    post.comments.push({ userId: req.user._id, text: input.text });
    await post.save();

    res.status(201).json({ commentCount: post.comments.length });
  } catch (err) {
    next(err);
  }
});

module.exports = { postsRouter };

