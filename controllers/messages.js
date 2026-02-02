// crud for chat
const Message = require("../models/messages");
const Project = require("../models/project");
const Task = require("../models/task");

// send messages and save
async function sendMessage(req, res) {
  try {
    const { conversationId, conversationType, text } = req.body;
    const sender = req.user.id;

    // validate conversation target
    if (conversationType === "project") {
      const project = await Project.findById(conversationId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      } else if (conversationType == "task") {
        const task = await Task.findById(conversationId);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
      } else {
        return res.status(400).json({ error: "Invalid converasation type" });
      }

      // create and save message
      const message = new Message({
        conversationId,
        conversationType,
        sender,
        text,
      });
      await message.save();

      return res
        .status(201)
        .json({ message: "Message sent successfully", data: message });
    }
  } catch (err) {
    console.error(" error sending message", err);
    return res.status(500).json({ error: "server error" });
  }
}

// get messages
async function getMessages(req, res) {
  try {
    const {conversationType, conversationId  } = req.params;
    const messages = await Message.find({ conversationId, conversationType })
      .populate("sender", "name email")
      .sort({ createdAt: 1 }); //oldest -> new
    return res.status(200).json({ messages });
  } catch (err) {
    console.error("error getting messages", err);
    return res.status(500).json({ error: "server error" });
  }
};




module.exports = {
  sendMessage,
  getMessages,
};
