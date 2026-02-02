// routes for the messages
const express = require("express");
const { getMessages, sendMessage } = require("../controllers/messages");
const router = express.Router();
const userAuthMiddleware = require("../middleware/userAuth");

//send messages to conversation
router.post("/messages", userAuthMiddleware, sendMessage);

//get messages for conversation
router.get("/:conversationType/:conversationId", userAuthMiddleware, getMessages);

module.exports = router;
