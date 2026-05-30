// Functions for CRUD operations for tasks within a project

const Project = require("../models/project");
const Task = require("../models/task");
const mongoose = require("mongoose");
const Activity = require("../models/activity");

// ✅ Helper function to check project membership
async function checkProjectAccess(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw { status: 400, message: "Invalid project ID" };
  }

  const project = await Project.findOne({
    _id: projectId,
    members: userId,
  });

  if (!project) {
    throw {
      status: 404,
      message: "Project not found or access denied",
    };
  }

  return project;
}

// ✅ Check whether assigned user is part of project
async function checkUserInProject(projectId, userId) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw {
      status: 404,
      message: "Project not found",
    };
  }

  if (!project.members.includes(userId)) {
    throw {
      status: 400,
      message: "Assigned user is not a member of the project",
    };
  }

  return true;
}

// CREATE TASK

async function createTask(req, res) {
  const {
    title,
    description,
    projectId,
    assignedTo,
    startDate,
    endDate,
    priority,
    status,
  } = req.body;

  const userId = req.user._id;

  try {
    const io = req.app.get("io");

    await checkProjectAccess(
      projectId,
      userId,
    );

    if (assignedTo) {
      await checkUserInProject(
        projectId,
        assignedTo,
      );
    }

    // FIND NEXT POSITION

    const lastTask =
      await Task.findOne({
        projectId,
        status: status || "to-do",
      }).sort({ position: -1 });

    const nextPosition = lastTask
      ? lastTask.position + 1
      : 0;

    // CREATE TASK

    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo,
      startDate,
      endDate,
      priority,
      status: status || "to-do",
      position: nextPosition,
      createdBy: req.user._id,
    });

    await newTask.save();

    // POPULATE

    await newTask.populate(
      "assignedTo",
      "name email",
    );

    await newTask.populate(
      "createdBy",
      "name email",
    );

    /*
    =========================================
    REALTIME TASK EVENT
    =========================================
    */

    io.to(projectId.toString()).emit(
      "taskCreated",
      newTask,
    );

    /*
    =========================================
    ACTIVITY CREATION
    =========================================
    */

    const activity =
      await Activity.create({
        projectId,

        userId: req.user._id,

        type: "TASK_CREATED",

        taskId: newTask._id,

        message: `${req.user.name} created task "${newTask.title}"`,
      });

    await activity.populate(
      "userId",
      "name email",
    );

    /*
    =========================================
    REALTIME ACTIVITY EVENT
    =========================================
    */

    io.to(projectId.toString()).emit(
      "activityCreated",
      activity,
    );

    res.status(201).json({
      message:
        "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error(
      "Error creating task:",
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

// GET ALL TASKS

async function getTasks(req, res) {
  const { projectId } = req.params;

  const userId = req.user._id;

  try {
    await checkProjectAccess(projectId, userId);

    const tasks = await Task.find({
      projectId,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({
        status: 1,
        position: 1,
        createdAt: 1,
      });

    res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res
      .status(error.status || 500)
      .json({
        message:
          error.message || "Internal server error",
      });
  }
}


// UPDATE TASK

async function updateTask(req, res) {
  const { taskId } = req.params;

  const {
    title,
    description,
    assignedTo,
    status,
    startDate,
    endDate,
    priority,
    position,
  } = req.body;

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

    // TRACK STATUS CHANGE

    const previousStatus =
      task.status;

    /*
    =========================================
    BASIC UPDATES
    =========================================
    */

    if (title !== undefined) {
      task.title = title;
    }

    if (
      description !== undefined
    ) {
      task.description =
        description;
    }

    if (startDate !== undefined) {
      task.startDate = startDate;
    }

    if (endDate !== undefined) {
      task.endDate = endDate;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    /*
    =========================================
    ASSIGNED USER
    =========================================
    */

    if (assignedTo !== undefined) {
      if (assignedTo) {
        await checkUserInProject(
          task.projectId,
          assignedTo,
        );
      }

      task.assignedTo = assignedTo;
    }

    /*
    =========================================
    STATUS CHANGE
    =========================================
    */

    if (
      status &&
      status !== task.status
    ) {
      const lastTask =
        await Task.findOne({
          projectId:
            task.projectId,
          status,
        }).sort({
          position: -1,
        });

      task.position = lastTask
        ? lastTask.position + 1
        : 0;

      task.status = status;
    }

    /*
    =========================================
    POSITION CHANGE
    =========================================
    */

    if (
      position !== undefined &&
      typeof position === "number"
    ) {
      task.position = position;
    }

    await task.save();

    await task.populate(
      "assignedTo",
      "name email",
    );

    /*
    =========================================
    REALTIME TASK EVENT
    =========================================
    */

    io.to(
      task.projectId.toString(),
    ).emit("taskUpdated", task);

    /*
    =========================================
    ACTIVITY MESSAGE
    =========================================
    */

    let activityMessage = `${req.user.name} updated task "${task.title}"`;

    // SPECIAL MESSAGE FOR KANBAN MOVE

    if (
      status &&
      previousStatus !== status
    ) {
      activityMessage = `${req.user.name} moved task "${task.title}" from ${previousStatus} to ${status}`;
    }

    /*
    =========================================
    CREATE ACTIVITY
    =========================================
    */

    const activity =
      await Activity.create({
        projectId: task.projectId,

        userId: req.user._id,

        type:
          previousStatus !== status
            ? "TASK_MOVED"
            : "TASK_UPDATED",

        taskId: task._id,

        message: activityMessage,
      });

    await activity.populate(
      "userId",
      "name email",
    );
    /*
    =========================================
    REALTIME ACTIVITY EVENT
    =========================================
    */

    io.to(
      task.projectId.toString(),
    ).emit(
      "activityCreated",
      activity,
    );

    res.status(200).json({
      message:
        "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Error updating task:",
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


// DELETE TASK

async function deleteTask(req, res) {
  const { taskId } = req.params;

  const userId = req.user._id;
  console.log(userId, "thi is  userID  ....  . .")

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

    const projectId =
      task.projectId.toString();

    /*
    =========================================
    CREATE ACTIVITY
    =========================================
    */

    const activity =
      await Activity.create({
        projectId:
          task.projectId,

        userId: req.user._id,

        type: "TASK_DELETED",

        taskId: task._id,

        message: `${req.user.name} deleted task "${task.title}"`,
      });

    await activity.populate(
      "userId",
      "name email",
    );

    /*
    =========================================
    DELETE TASK
    =========================================
    */

    await task.deleteOne();

    /*
    =========================================
    REALTIME TASK EVENT
    =========================================
    */

    io.to(projectId).emit(
      "taskDeleted",
      {
        taskId,
      },
    );

    /*
    =========================================
    REALTIME ACTIVITY EVENT
    =========================================
    */

    io.to(projectId).emit(
      "activityCreated",
      activity,
    );

    res.status(200).json({
      message:
        "Task deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error deleting task:",
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



// GET SINGLE TASK

async function getTaskById(req, res) {
  const { taskId } = req.params;

  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await checkProjectAccess(task.projectId, userId);

    res.status(200).json({
      task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);

    res
      .status(error.status || 500)
      .json({
        message:
          error.message || "Internal server error",
      });
  }
}



// GET ASSIGNED TASKS

async function getAssignedTasks(req, res) {
  try {
    const userId = req.user._id;

    const tasks = await Task.find({
      assignedTo: userId,
    })
      .populate("projectId", "title createdBy")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      tasks,
    });
  } catch (err) {
    console.error(
      "Error fetching assigned tasks:",
      err,
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
}



module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskById,
  getAssignedTasks,
  checkProjectAccess,
  checkUserInProject,
};
