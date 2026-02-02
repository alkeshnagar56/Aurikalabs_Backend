const express = require("express");
const router = express.Router();
const { handleSignup, handleLogin, handleLogout, handleUpdate, getProfile } = require("../controllers/userAuth");
const userAuthMiddleware = require("../middleware/userAuth");


router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.put("/update", userAuthMiddleware, handleUpdate);
router.get("/profile", userAuthMiddleware, getProfile);


module.exports = router;
