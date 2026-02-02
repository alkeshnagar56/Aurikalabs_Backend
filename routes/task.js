//routes to manage task within the projects
const express = require("express");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAssignedTasks,
} = require("../controllers/task");
const userAuthMiddleware = require("../middleware/userAuth");
const projectCheckMiddleware = require("../middleware/projectCheck");
const router = express.Router();

// Create a new task in a project
router.post(
  "/createtask",
  userAuthMiddleware,
  projectCheckMiddleware,
  createTask
);

// Get all tasks in a project
router.get(
  "/gettasks/:projectId",
  userAuthMiddleware,
  projectCheckMiddleware,
  getTasks
);

// Get a specific task by ID
router.get("/gettask/:taskId", userAuthMiddleware, getTaskById);

// Update a task by ID
router.put("/updatetask/:taskId", userAuthMiddleware, updateTask);

// Delete a task by ID
router.delete("/deletetask/:taskId", userAuthMiddleware, deleteTask);

// all assigned tasks
router.get("/assignedtasks", userAuthMiddleware, getAssignedTasks);

module.exports = router;
