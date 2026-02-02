const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getAssociatedProjects,
} = require("../controllers/project");
const userAuthMiddleware = require("../middleware/userAuth");
const router = express.Router();

router.post("/createproject", userAuthMiddleware, createProject);

router.get("/getprojects", userAuthMiddleware, getProjects);

router.get("/getproject/:id", userAuthMiddleware, getProjectById);

router.put("/updateproject/:id", userAuthMiddleware, updateProject);

router.delete("/deleteproject/:id", userAuthMiddleware, deleteProject);

router.post("/:id/addmember", userAuthMiddleware, addMember);

router.post("/:id/removemember", userAuthMiddleware, removeMember);

router.get("/associatedprojects", userAuthMiddleware, getAssociatedProjects);

module.exports = router;
