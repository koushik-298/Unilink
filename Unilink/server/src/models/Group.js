const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    maxMembers: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Group = mongoose.model("Group", GroupSchema);

module.exports = { Group };

