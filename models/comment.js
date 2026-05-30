const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },

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

        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true },
);

const Comment = mongoose.model(
    "Comment",
    commentSchema,
);

module.exports = Comment;