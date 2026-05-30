const express = require("express");

const router = express.Router();

const userAuthMiddleware = require("../middleware/userAuth");

const {
    getProjectActivities,
    getTaskActivities,
} = require("../controllers/activity");



router.get(
    "/project/:projectId",
    userAuthMiddleware,
    getProjectActivities,
);
router.get(
    "/taskactivities/:taskId",
    userAuthMiddleware,
    getTaskActivities,
);

module.exports = router;