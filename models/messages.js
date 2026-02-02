// models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    conversationType: {
      type: String,
      enum: ["project", "task"], // extend later if needed (e.g. "direct")
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError in dev with nodemon
module.exports =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
