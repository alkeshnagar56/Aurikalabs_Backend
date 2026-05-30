const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const activitySchema = new Schema(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "TASK_CREATED",
                "TASK_UPDATED",
                "TASK_DELETED",
                "TASK_MOVED",
                "MEMBER_ADDED",
                "MEMBER_REMOVED",
                "PROJECT_UPDATED",
            ],
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
        },
    },
    { timestamps: true }
);

const Activity = mongoose.model(
    "Activity",
    activitySchema,
);

module.exports = Activity;