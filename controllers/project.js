const Project = require("../models/project");
const Task = require("../models/task");
const User = require("../models/user");
const { checkProjectAccess } = require("./task");

// CREATE
async function createProject(req, res) {
  const { title, description, startDate, endDate } = req.body;
  const userId = req.user._id;
  try {
    const newProject = new Project({
      title,
      description,
      startDate,
      endDate,
      createdBy: userId,
      members: [userId],
    });
    await newProject.save();
    res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// READ (all projects of a user)
async function getProjects(req, res) {
  const userId = req.user._id;
  try {
    const projects = await Project.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .populate("members", "name email");
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// READ (single project by ID)
async function getProjectById(req, res) {
  const projectId = req.params.id;
  const userId = req.user._id;
  try {
    const project = await Project.findOne({
      _id: projectId,
      members: userId,
    })
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or access denied" });
    }

    res.status(200).json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// UPDATE
async function updateProject(req, res) {
  const projectId = req.params.id;
  const userId = req.user._id;
  const { title, description, startDate, endDate, status } = req.body;

  try {
    const project = await Project.findOne({
      _id: projectId,
      members: userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or access denied" });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (status) project.status = status;

    await project.save();

    res.status(200).json({ message: "Project updated successfully", project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE
async function deleteProject(req, res) {
  const projectId = req.params.id;
  const userId = req.user._id;

  try {
    const project = await Project.findOne({
      _id: projectId,
      createdBy: userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or access denied" });
    }

    // delete all tasks inside project
    await Task.deleteMany({ projectId: project._id });
    // delete project itself
    await project.deleteOne();

    res.status(200).json({
      message: "Project and associated tasks deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Add member to project by email
async function addMember(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const alreadyMember = project.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    );

    if (!alreadyMember) {
      project.members.push(user._id);
      await project.save();
    }

    // 🔥 Populate members to include name + email
    const updatedProject = await Project.findById(req.params.id).populate(
      "members",
      "name email"
    ); // only fetch name & email

    res.json({
      message: alreadyMember ? "User is already a member" : "Member added",
      members: updatedProject.members,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// remove member from project by email
async function removeMember(req, res) {
  const { email } = req.body;
  const userId = req.user._id;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: userId,
    });
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or access denied" });
    }
    project.members = project.members.filter(
      (memberId) => memberId.toString() !== user._id.toString()
    );
    await project.save();
    res.json({ message: "Member removed", project });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// get all the associated projects of user in which he is envolve
const getAssociatedProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      members: userId,
      createdBy: { $ne: userId }, // exclude projects created by user
    }).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Error fetching associated projects:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getAssociatedProjects,
};
