const express = require("express");
const { z } = require("zod");

const { verifyToken } = require("../middleware/auth");
const { Group } = require("../models/Group");

const groupsRouter = express.Router();

groupsRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

groupsRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const schema = z.object({
      groupName: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
      maxMembers: z.number().int().min(0).max(10000).optional(),
    });
    const input = schema.parse(req.body);

    const group = await Group.create({
      groupName: input.groupName,
      description: input.description || "",
      createdBy: req.user._id,
      members: [req.user._id],
      maxMembers: input.maxMembers ?? 0,
    });

    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

groupsRouter.post("/:groupId/join", verifyToken, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Not found" });

    const me = String(req.user._id);
    const isMember = group.members.some((id) => String(id) === me);
    if (!isMember) {
      if (group.maxMembers > 0 && group.members.length >= group.maxMembers) {
        return res.status(400).json({ error: "Group is full" });
      }
      group.members.push(req.user._id);
      await group.save();
    }

    res.json({ joined: true, memberCount: group.members.length });
  } catch (err) {
    next(err);
  }
});

groupsRouter.post("/:groupId/leave", verifyToken, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Not found" });

    const me = String(req.user._id);
    group.members = group.members.filter((id) => String(id) !== me);
    await group.save();

    res.json({ left: true, memberCount: group.members.length });
  } catch (err) {
    next(err);
  }
});

module.exports = { groupsRouter };

