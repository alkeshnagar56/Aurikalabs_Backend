require("dotenv").config();
const Message = require("../models/messages");
const User = require("../models/user");

function initSocket(io) {
  console.log("✅ Socket initialized:", process.env.CLIENT_ORIGIN);

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, socket.user?.id);

    // join a conversation room
    socket.on("join", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(conversationId);
      socket.to(conversationId).emit("presence", {
        userId: socket.user?.id,
        status: "online",
      });
    });

    // typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("typing", {
        userId: socket.user?.id,
        name: socket.user?.name,
        isTyping,
      });
    });

    // send message
    socket.on("sendMessage", async (payload, ack) => {
      try {
        const msg = await Message.create({
          conversationId: payload.conversationId,
          conversationType: payload.conversationType,
          status: "sent", // default status
          sender: socket.user.id,
          text: payload.text,
          attachments: payload.attachments || [],
        });

        const populated = await msg.populate("sender", "name email");

        io.to(payload.conversationId).emit("message", populated);

        if (ack) ack({ success: true, message: populated });
      } catch (err) {
        console.error(err);
        if (ack) ack({ success: false });
      }
    });

    // read receipt
    socket.on("markRead", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );
        io.to(conversationId).emit("messagesRead", {
          messageIds,
          userId: socket.user.id,
        });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
