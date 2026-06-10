const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const protect = require("../middleware/auth");

// Protect all task routes with auth middleware
router.use(protect);

// ========================================
// CREATE NEW TASK
// ========================================

router.post("/", async (req, res) => {
  try {
    const { task } = req.body;
    // Create a new task for the authenticated user from req.user.id
    const newTask = await Task.create({
      task,
      user: req.user.id,
    });
    res.status(201).json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
});

// ========================================
// GET ALL USER'S TASKS
// ========================================

router.get("/", async (req, res) => {
  try {
    // Find all tasks owned by authenticated user
    const tasks = await Task.find({ user: req.user.id });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
});

// ========================================
// UPDATE TASK (TOGGLE COMPLETE)
// ========================================

router.put("/", async (req, res) => {
  try {
    const task = await Task.findById(req.body.id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    // Toggle completion status and save
    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }
    await task.save();

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
});

// ========================================
// DELETE TASK
// ========================================

router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    res.json({
      success: true,
      message: "task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
});

module.exports = router;
