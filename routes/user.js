const express = require("express");
const router = express.Router();
const { handleSignup, handleLogin, handleLogout, handleGoogleLogin, handleUpdate, getProfile, sendOtp, verifyOtp, resetPassword, verifyEmail } = require("../controllers/userAuth");
const userAuthMiddleware = require("../middleware/userAuth");



router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/google-login", handleGoogleLogin);
router.put("/update", userAuthMiddleware, handleUpdate);
router.get("/profile", userAuthMiddleware, getProfile);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp,);

router.post("/reset-password", resetPassword,);

router.post("/verify-email", verifyEmail,);

module.exports = router;
