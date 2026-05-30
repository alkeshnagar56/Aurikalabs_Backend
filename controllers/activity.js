const Activity = require("../models/activity");
const Project = require("../models/project");
const { checkProjectAccess } = require("./task");
const mongoose = require("mongoose");
const Task = require("../models/task");

/*
=========================================================
GET PROJECT ACTIVITIES
=========================================================
*/

async function getProjectActivities(
    req,
    res,
) {
    const { projectId } = req.params;

    const userId = req.user._id;

    try {
        await checkProjectAccess(
            projectId,
            userId,
        );

        const activities =
            await Activity.find({
                projectId,
            })
                .populate(
                    "userId",
                    "name email",
                )
                .sort({
                    createdAt: -1,
                })
                .limit(50);

        res.status(200).json({
            activities,
        });
    } catch (error) {
        console.error(
            "Error fetching activities:",
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
=========================================================
CREATE ACTIVITY HELPER
=========================================================
*/

async function createActivity({
    projectId,
    userId,
    type,
    message,
    taskId = null,
    io = null,
}) {
    try {
        const activity =
            await Activity.create({
                projectId,
                userId,
                type,
                message,
                taskId,
            });

        const populated =
            await activity.populate(
                "userId",
                "name email",
            );

        // realtime emit
        if (io) {
            io.to(projectId.toString()).emit(
                "activityCreated",
                populated,
            );
        }

        return populated;
    } catch (error) {
        console.error(
            "Error creating activity:",
            error,
        );
    }
}

/*
=========================================
GET TASK ACTIVITIES
=========================================
*/

async function getTaskActivities(
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

        const activities =
            await Activity.find({
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
            activities,
        });
    } catch (error) {
        console.error(
            "Error fetching task activities:",
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
    getProjectActivities,
    createActivity,
    getTaskActivities,
};