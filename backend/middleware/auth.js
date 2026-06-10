const jwt = require("jsonwebtoken");
const User = require("../models/user");

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

// Middleware to protect routes - checks if request includes a valid JWT cookie
const protect = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied, no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found",
      });

    req.user = user; // downstream routes can use req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protect;
