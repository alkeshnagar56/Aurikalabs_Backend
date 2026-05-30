const mongoose = require("mongoose");

const Comment = require("../models/comment");
const Task = require("../models/task");
const Activity = require("../models/activity");

const {
    checkProjectAccess,
} = require("./task");

/*
=========================================
CREATE COMMENT
=========================================
*/

async function createComment(req, res) {
    const { taskId } = req.params;

    const { message } = req.body;

    const userId = req.user._id;

    try {
        const io = req.app.get("io");

        if (
            !mongoose.Types.ObjectId.isValid(
                taskId,
            )
        ) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }

        const task =
            await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        await checkProjectAccess(
            task.projectId,
            userId,
        );

        /*
        =========================================
        CREATE COMMENT
        =========================================
        */

        const comment =
            await Comment.create({
                taskId: task._id,
                projectId: task.projectId,
                userId,
                message,
            });

        await comment.populate(
            "userId",
            "name email",
        );

        /*
        =========================================
        CREATE ACTIVITY
        =========================================
        */

        const activity =
            await Activity.create({
                projectId:
                    task.projectId,

                userId,

                type: "TASK_UPDATED",

                taskId: task._id,

                message: `${req.user.name} commented on "${task.title}"`,
            });

        await activity.populate(
            "userId",
            "name email",
        );

        /*
        =========================================
        REALTIME EVENTS
        =========================================
        */

        io.to(
            task._id.toString(),
        ).emit(
            "commentCreated",
            comment,
        );

        io.to(
            task.projectId.toString(),
        ).emit(
            "activityCreated",
            activity,
        );

        res.status(201).json({
            message:
                "Comment added successfully",

            comment,
        });
    } catch (error) {
        console.error(
            "Error creating comment:",
            error,
        );

        res
            .status(error.status || 500)
            .json({
                message:
                    error.message ||
                    "Internal server error",
            });
    }
}

/*
=========================================
GET TASK COMMENTS
=========================================
*/

async function getTaskComments(
    req,
    res,
) {
    const { taskId } = req.params;

    const userId = req.user._id;

    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                taskId,
            )
        ) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }

        const task =
            await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        await checkProjectAccess(
            task.projectId,
            userId,
        );

        const comments =
            await Comment.find({
                taskId,
            })
                .populate(
                    "userId",
                    "name email",
                )
                .sort({
                    createdAt: -1,
                });

        res.status(200).json({
            comments,
        });
    } catch (error) {
        console.error(
            "Error fetching comments:",
            error,
        );

        res
            .status(error.status || 500)
            .json({
                message:
                    error.message ||
                    "Internal server error",
            });
    }
}

/*
=========================================
DELETE COMMENT
=========================================
*/

async function deleteComment(
    req,
    res,
) {
    const { commentId } = req.params;

    const userId = req.user._id;

    try {
        const io = req.app.get("io");

        if (
            !mongoose.Types.ObjectId.isValid(
                commentId,
            )
        ) {
            return res.status(400).json({
                message: "Invalid comment ID",
            });
        }

        const comment =
            await Comment.findById(
                commentId,
            );

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found",
            });
        }

        await checkProjectAccess(
            comment.projectId,
            userId,
        );

        /*
        =========================================
        ONLY COMMENT OWNER CAN DELETE
        =========================================
        */

        if (
            comment.userId.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized to delete comment",
            });
        }

        await comment.deleteOne();

        /*
        =========================================
        REALTIME EVENT
        =========================================
        */

        io.to(
            comment.taskId.toString(),
        ).emit(
            "commentDeleted",
            {
                commentId,
            },
        );

        res.status(200).json({
            message:
                "Comment deleted successfully",
        });
    } catch (error) {
        console.error(
            "Error deleting comment:",
            error,
        );

        res
            .status(error.status || 500)
            .json({
                message:
                    error.message ||
                    "Internal server error",
            });
    }
}

module.exports = {
    createComment,
    getTaskComments,
    deleteComment,
};