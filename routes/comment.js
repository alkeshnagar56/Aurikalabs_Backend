const express = require("express");

const router = express.Router();

const userAuthMiddleware = require("../middleware/userAuth")

const {
    createComment,
    getTaskComments,
    deleteComment,
} = require("../controllers/comment");

/*
=========================================
CREATE COMMENT
=========================================
*/

router.post(
    "/createcomment/:taskId",
    userAuthMiddleware,
    createComment,
);

/*
=========================================
GET TASK COMMENTS
=========================================
*/

router.get(
    "/getcomments/:taskId",
    userAuthMiddleware,
    getTaskComments,
);

/*
=========================================
DELETE COMMENT
=========================================
*/

router.delete(
    "/deletecomment/:commentId",
    userAuthMiddleware,
    deleteComment,
);

module.exports = router;