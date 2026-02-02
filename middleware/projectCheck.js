// Check authorization before creating or modifying tasks in a project
const Project = require("../models/project");
module.exports = async function (req, res, next) {
  const projectId =
    (req.body && req.body.projectId) || (req.params && req.params.projectId);

  const userId = req.user._id;

  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required" });
  }

  try {
    const project = await Project.findOne({
      _id: projectId,
      members: userId,
    });

    if (!project) {
      return res
        .status(403)
        .json({ message: "Access denied to the specified project" });
    }

    next();
  } catch (error) {
    console.error("Error in project check middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
