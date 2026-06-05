require("dotenv").config();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");
const { generateToken } = require("../services/auth");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
);


async function handleGoogleLogin(
  req,
  res,
) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Credential missing",
      });
    }

    const ticket =
      await client.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    const {
      sub,
      email,
      name,
      picture,
    } = payload;

    let user =
      await User.findOne({
        email,
      });

    /*
    =========================================
    EXISTING USER
    =========================================
    */

    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
        providerId: sub,
        avatar: picture,
      });
    } else {
      if (
        user.provider !== "google"
      ) {
        user.provider = "google";

        user.providerId = sub;

        user.avatar =
          picture ||
          user.avatar;

        await user.save();
      }
    }

    const token =
      generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge:
        7 *
        24 *
        60 *
        60 *
        1000,
    });

    res.status(200).json({
      message:
        "Google login successful",
    });
  } catch (error) {
    console.error(
      "Google login error:",
      error,
    );

    res.status(500).json({
      message:
        "Google authentication failed",
    });
  }
}

async function handleSignup(req, res) {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const otp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry: new Date(
        Date.now() + 10 * 60 * 1000,
      ),
    });

    await newUser.save();

    await sendEmail(
      email,
      "Verify Your Aurika Labs Account",
      `
      <div style="font-family: Arial, sans-serif;">
        <h2>Aurika Labs</h2>

        <p>Welcome to Aurika Labs.</p>

        <p>Your verification OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP expires in 10 minutes.</p>
      </div>
      `,
    );

    return res.status(201).json({
      message:
        "Account created. Please verify your email.",
    });
  } catch (error) {
    console.error(
      "Error during signup:",
      error,
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid email or password",
      });
    }

    if (
      user.provider === "google"
    ) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message:
          "Please verify your email first",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "Invalid email or password",
      });
    }

    const token =
      generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge:
        7 *
        24 *
        60 *
        60 *
        1000,
    });

    res.status(200).json({
      message: "Login successful",
    });
  } catch (error) {
    console.error(
      "Error during login:",
      error,
    );

    res.status(500).json({
      message:
        "Internal server error",
    });
  }
}

async function handleLogout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function handleUpdate(req, res) {
  const { name, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  }
  catch (error) {
    console.error("Error during user update:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      avatar: user.avatar
    });
  }
  catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


/*
SEND OTP
*/

async function sendOtp(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (
      user.provider === "google"
    ) {
      return res.status(400).json({
        message:
          "This account uses Google Sign-In",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    user.otp = otp;

    user.otpExpiry = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    await user.save();

    await sendEmail(
      email,
      "Aurika Labs OTP Verification",
      `
      <div style="font-family:Arial,sans-serif">
        <h2>Aurika Labs</h2>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP will expire in 10 minutes.</p>
      </div>
      `,
    );

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
}

/*
VERIFY OTP
*/

async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      !user.otp ||
      user.otp !== otp
    ) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (
      new Date() >
      user.otpExpiry
    ) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    res.status(200).json({
      message: "OTP verified",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Verification failed",
    });
  }
}

/*
RESET PASSWORD
*/

async function resetPassword(
  req,
  res,
) {
  const {
    email,
    otp,
    newPassword,
  } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      !user.otp ||
      user.otp !== otp
    ) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (
      new Date() >
      user.otpExpiry
    ) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10,
      );

    user.password =
      hashedPassword;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successful",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to reset password",
    });
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    user.isVerified = true;

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error,
    );

    res.status(500).json({
      message: "Verification failed",
    });
  }
}



module.exports = {
  handleSignup,
  handleLogin,
  handleLogout,
  handleGoogleLogin,
  handleUpdate,
  getProfile,
  sendOtp,
  verifyOtp,
  resetPassword,
  verifyEmail
};
