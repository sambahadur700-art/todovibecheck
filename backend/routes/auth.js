const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// Helper to parse cookies from the request header
function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [name, ...rest] = cookie.split("=");
      return [name, decodeURIComponent(rest.join("="))];
    })
    .reduce((acc, [name, value]) => {
      acc[name] = value;
      return acc;
    }, {});
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const COOKIE_MAX_AGE =
  Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000;

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: COOKIE_MAX_AGE,
};

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register route: receives name, email, password from frontend
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists in the database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user record with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id);
    // Store JWT in a secure httpOnly cookie so browser JS cannot read it
    res.cookie("token", token, cookieOptions);

    // Respond back to frontend with success and user data
    res.status(201).json({
      message: "user registered successfully",
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
});

// ========================================
// LOGIN USER ROUTE
// =======================================

router.post("/login", async (req, res) => {
  try {
    // Accept email/password from request body
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    // Find user and include hashed password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createToken(user._id);
    // Store JWT in a secure, httpOnly cookie
    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
});

// Logout route: clears the authentication cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    ...cookieOptions,
    maxAge: 0,
  });
  res.json({ success: true, message: "Logged out" });
});

// Google sign-in route: verifies the Google ID token and issues a JWT cookie
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google account email is required" });
    }

    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        googleId: sub,
      });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const token = createToken(user._id);
    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Google login failed" });
  }
});

// Status route: returns whether the current cookie is valid
router.get("/status", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.token;
    if (!token) {
      return res.json({ success: true, authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ success: true, authenticated: false });
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.json({ success: true, authenticated: false });
  }
});

module.exports = router;
