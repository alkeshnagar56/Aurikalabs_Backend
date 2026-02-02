// Functions for CRUD operations for tasks within a project
const Project = require("../models/project");
const Task = require("../models/task");
const mongoose = require("mongoose");

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
    throw { status: 404, message: "Project not found or access denied" };
  }

  return project;
}

// helper functions too check wheather assignedTo user is part of the project
async function checkUserInProject(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw { status: 404, message: "Project not found" };
  }
  if (!project.members.includes(userId)) {
    throw {
      status: 400,
      message: "Assigned user is not a member of the project",
    };
  }
  return true;
}

// CREATE Task
async function createTask(req, res) {
  const {
    title,
    description,
    projectId,
    assignedTo,
    startDate,
    endDate,
    priority,
  } = req.body;
  const userId = req.user._id;

  try {
    await checkProjectAccess(projectId, userId);
    if (assignedTo) {
      await checkUserInProject(projectId, assignedTo);
    }

    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo,
      startDate,
      endDate,
      priority,
      createdBy: req.user._id,
    });

    await newTask.save();

    res.status(201).json({
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

//get all tasks related to project
async function getTasks(req, res) {
  const { projectId } = req.params;
  const userId = req.user._id;

  try {
    await checkProjectAccess(projectId, userId);

    const tasks = await Task.find({
      projectId,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    if (tasks.length === 0) {
      return res.status(200).json({ message: "No tasks available" });
    }

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

//update the task
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
  } = req.body;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await checkProjectAccess(task.projectId, userId);

    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) {
      await checkUserInProject(task.projectId, assignedTo);
      task.assignedTo = assignedTo;
    }
    if (status) task.status = status;
    if (startDate) task.startDate = startDate;
    if (endDate) task.endDate = endDate;
    if (priority) task.priority = priority;

    await task.save();
    await task.populate("assignedTo", "name email");
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

//delete task
async function deleteTask(req, res) {
  const { taskId } = req.params;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await checkProjectAccess(task.projectId, userId);

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

//get single task by id
async function getTaskById(req, res) {
  const { taskId } = req.params;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await checkProjectAccess(task.projectId, userId);

    res.status(200).json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
}

async function getAssignedTasks(req, res) {
  try {
    const userId = req.user._id;

    // Only tasks where the user is assigned
    const tasks = await Task.find({ assignedTo: userId })
      .populate("projectId", "title createdBy")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({ tasks });
  } catch (err) {
    console.error("Error fetching assigned tasks:", err);
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskById,
  getAssignedTasks,
};
