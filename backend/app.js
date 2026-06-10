const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const app = express();

// Trust proxy headers when running behind a load balancer or proxy
// so secure cookies can work properly in production.
app.set("trust proxy", 1);

(async () => {
  await connectDB(); // connect to MongoDB before handling requests
})();

// Middleware
app.use(cors({ origin: true, credentials: true })); // allow cookies from frontend requests
app.use(express.json({ limit: "10mb" })); // parse JSON request bodies
app.use(express.urlencoded({ extended: false, limit: "10mb" })); // parse form data

// Serve frontend files from the repo root over HTTPS if the cert is available
app.use("/backend", (req, res) => res.status(404).send("Not found"));
app.use("/certs", (req, res) => res.status(404).send("Not found"));
app.use(express.static(path.join(__dirname, "..")));

app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Mount routes under API paths
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
  });
});

// Central error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "something went wrong",
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
