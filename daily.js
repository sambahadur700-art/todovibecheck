let dailyData = [];
const API_BASE_URL = window.location.origin.includes("localhost:5000")
  ? "/api"
  : "https://localhost:5000/api";

// Load daily task data from backend for the logged-in user
async function loadDailyData() {
  const container = document.getElementById("dailyContent");

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        container.innerHTML =
          '<p style="text-align: center; color: white;">Please sign in first to view your daily progress.</p>';
        return;
      }
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch tasks");
    }

    dailyData = aggregateByDate(data.tasks);
    renderDailyTable();
  } catch (error) {
    console.error("Error loading daily data:", error);
    container.innerHTML =
      '<p style="text-align: center; color: white;">Unable to load daily progress. Please make sure you are signed in and the backend is running.</p>';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function aggregateByDate(tasks) {
  const grouped = {};

  tasks.forEach((task) => {
    const createdDate = task.createdAt ? new Date(task.createdAt) : new Date();
    const dateKey = createdDate.toISOString().split("T")[0];

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        tasks: [],
      };
    }

    grouped[dateKey].tasks.push({
      ...task,
      text: task.task || task.text || "",
      time: formatTime(task.createdAt || new Date()),
    });
  });

  return Object.values(grouped);
}

async function deleteDailyTask(taskId) {
  const container = document.getElementById("dailyContent");

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
    if (data.success) {
      await loadDailyData();
    } else {
      throw new Error(data.message || "Delete failed");
    }
  } catch (error) {
    console.error("Error deleting daily task:", error);
    container.innerHTML =
      '<p style="text-align: center; color: white;">Unable to delete task. Please try again.</p>';
  }
}

function renderDailyTable() {
  const container = document.getElementById("dailyContent");

  if (dailyData.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: white;">No data available.</p>';
    return;
  }

  container.innerHTML = "";

  // Sort data by date (newest first)
  dailyData.sort((a, b) => new Date(b.date) - new Date(a.date));

  dailyData.forEach((dayData) => {
    const completedCount = dayData.tasks.filter(
      (task) => task.completed,
    ).length;
    const totalCount = dayData.tasks.length;
    const pendingCount = totalCount - completedCount;

    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-date">${formatDate(dayData.date)}</div>
        <div class="day-stats">
          <span class="stat completed-stat">✅ ${completedCount} Completed</span>
          <span class="stat pending-stat">⏳ ${pendingCount} Pending</span>
        </div>
      </div>
      
      <table class="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${dayData.tasks
            .map(
              (task) => `
            <tr>
              <td>${task.text}</td>
              <td class="task-time">${task.time}</td>
              <td>
                <span class="status-badge ${task.completed ? "status-completed" : "status-pending"}">
                  ${task.completed ? "✅ Completed" : "⏳ Pending"}
                </span>
              </td>
              <td>
                <button class="action-btn" style="background:#fee2e2; color:#ef4444; padding:4px 8px;" onclick="deleteDailyTask('${task._id}')">
                  Delete
                </button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

    container.appendChild(dayCard);
  });
}

// Load data when page loads
document.addEventListener("DOMContentLoaded", loadDailyData);
