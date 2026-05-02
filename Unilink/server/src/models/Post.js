const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const PostSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    comments: { type: [CommentSchema], default: [] },
    reports: {
      type: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
      }],
      default: [],
    },
  },
  { timestamps: true },
);

const Post = mongoose.model("Post", PostSchema);

module.exports = { Post };

