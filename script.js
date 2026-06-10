// Frontend state
let todoList = []; // holds tasks received from the backend
let currentIndex = null; // used when editing a task
let isAuthenticated = false; // login state is tracked via server cookie

const taskinput = document.getElementById("task-input");
const addtaskbtn = document.getElementById("addTask");
const taskcontainer = document.getElementById("taskcontainer");

// API base URL for the backend routes
const API_BASE_URL = window.location.origin.includes("localhost:5000")
  ? "/api"
  : "https://localhost:5000/api";
const GOOGLE_CLIENT_ID =
  "977621932955-9tqiipmrfe6nnp0i9q0sm5ljuld1ggdh.apps.googleusercontent.com";

// showPopup() creates a notification bubble instead of using alert()
function showPopup(message, type = "info") {
  const container = document.getElementById("popup-container");
  if (!container) return;

  const popup = document.createElement("div");
  popup.className = `popup ${type}`;
  popup.textContent = message;
  container.appendChild(popup);

  requestAnimationFrame(() => popup.classList.add("visible"));

  setTimeout(() => {
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 300);
  }, 3200);
}

// Toggle auth button visibility depending on whether user is authenticated
function updateAuthButtons() {
  const signInBtn = document.getElementById("signInBtn");
  const signUpBtn = document.getElementById("signUpBtn");
  const signOutBtn = document.getElementById("signOutBtn");

  if (isAuthenticated) {
    signInBtn.style.display = "none";
    signUpBtn.style.display = "none";
    signOutBtn.style.display = "inline-block";
  } else {
    signInBtn.style.display = "inline-block";
    signUpBtn.style.display = "inline-block";
    signOutBtn.style.display = "none";
  }
}

// Initialize Google sign-in and ask the backend whether the user is already authenticated
window.addEventListener("load", () => {
  initGoogleSignIn();
  checkAuthStatus();
});

function initGoogleSignIn() {
  const googleButton = document.getElementById("googleSignInButton");
  if (!googleButton || !window.google || !GOOGLE_CLIENT_ID) return;

  if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
    googleButton.style.display = "none";
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
    ux_mode: "popup",
  });

  google.accounts.id.renderButton(googleButton, {
    theme: "outline",
    size: "large",
    width: "100%",
  });
}

async function handleGoogleResponse(response) {
  if (!response || !response.credential) {
    showPopup("Google login failed. Please try again.", "error");
    return;
  }

  try {
    const googleResponse = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: response.credential }),
    });

    const data = await googleResponse.json();
    if (data.success) {
      isAuthenticated = true;
      updateAuthButtons();
      closeAllModals();
      showPopup("Logged in with Google successfully!", "success");
      await getTasks();
    } else {
      showPopup(data.message || "Google login failed", "error");
    }
  } catch (error) {
    console.error("Google login error:", error);
    showPopup("Google login failed. Check console for details.", "error");
  }
}

async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      credentials: "include",
    });
    const data = await response.json();

    isAuthenticated = data.success && data.authenticated;
    updateAuthButtons();

    if (isAuthenticated) {
      await getTasks();
    }
  } catch (error) {
    console.error("Auth status error:", error);
    isAuthenticated = false;
    updateAuthButtons();
  }
}

// ========================================
// API FUNCTIONS
// ========================================

// Fetch all tasks for the authenticated user
async function getTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      const todayKey = new Date().toISOString().split("T")[0];
      todoList = data.tasks.filter((task) => {
        if (!task.createdAt) return false;
        return (
          new Date(task.createdAt).toISOString().split("T")[0] === todayKey
        );
      });
      renderTasks();
    } else {
      console.log("failed to fetch tasks");
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

// Send a new task to backend and refresh the list
async function createTask(taskText) {
  if (!isAuthenticated) {
    showPopup("Please sign in first!", "warning");
    openModal("loginModal");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: taskText }),
    });
    const data = await response.json();

    if (data.success) {
      await getTasks(); // reload tasks after successful create
      taskinput.value = "";
    } else {
      showPopup("Failed to create task", "error");
    }
  } catch (error) {
    console.error("Error creating tasks:", error);
    showPopup("Error creating task. Make sure you're signed in.", "error");
  }
}

// MODAL LOGIC
function openModal(id) {
  // show modal by setting display mode
  document.getElementById(id).style.display = "flex";
}

function closeAllModals() {
  // hide every modal overlay
  document
    .querySelectorAll(".modal")
    .forEach((m) => (m.style.display = "none"));
}

function switchModal(closeId, openId) {
  // switch between login and signup modals
  document.getElementById(closeId).style.display = "none";
  document.getElementById(openId).style.display = "flex";
}

// Handle both login and sign up flows
async function handleAuth(e, type) {
  e.preventDefault();

  const form = e.target;
  const inputs = form.querySelectorAll("input");

  let name = "";
  let email = "";
  let password = "";

  inputs.forEach((input) => {
    if (input.type === "email") email = input.value;
    if (input.type === "password") password = input.value;
    if (input.type === "text" && input.placeholder.includes("Name"))
      name = input.value;
  });

  if (!email || !password) {
    showPopup("Please fill in all fields", "warning");
    return;
  }

  try {
    const endpoint = type === "Sign Up" ? "/auth/register" : "/auth/login";
    const body =
      type === "Sign Up" ? { name, email, password } : { email, password };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.success) {
      isAuthenticated = true; // user is logged in through secure cookie
      updateAuthButtons();
      showPopup(`${type} successful! Welcome to the vibe.`, "success");
      closeAllModals();
      form.reset();

      await getTasks(); // load tasks for the logged-in user
    } else {
      showPopup(data.message || `${type} failed`, "error");
    }
  } catch (error) {
    console.error("Auth error:", error);
    showPopup("Connection error. Make sure backend is running.", "error");
  }
}

async function handleSignOut() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Sign out error:", error);
  }

  isAuthenticated = false;
  todoList = [];
  renderTasks(); // clear local task view
  updateAuthButtons();
  showPopup("You have signed out successfully.", "success");
}

// TASK LOGIC
addtaskbtn.addEventListener("click", () => {
  const text = taskinput.value.trim();
  if (text) {
    createTask(text);
  }
});

function renderTasks() {
  taskcontainer.innerHTML = "";

  if (todoList.length === 0) {
    taskcontainer.innerHTML = `<p style="text-align:center; color: #9ca3af; margin-top: 20px;">Empty space is full of potential...</p>`;
    return;
  }

  todoList.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("task");
    const createdDate =
      new Date(item.createdAt).toLocaleDateString() +
      " " +
      new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    const completedClass = item.completed ? "completed" : "";
    div.innerHTML = `
            <div class="task-info">
                <div class="task-text ${completedClass}" style="${item.completed ? "text-decoration: line-through; opacity: 0.6;" : ""}">${item.task}</div>
                <div class="task-time">✨ Added: ${createdDate}</div>
            </div>
            <div class="btn-group">
                <button class="action-btn" style="background:#${item.completed ? "86efac" : "e0e7ff"}" onclick="toggleTask('${item._id}')">✔️</button>
                <button class="action-btn" style="background:#fee2e2; color:#ef4444" onclick="deleteTask('${item._id}')">🗑️</button>
            </div>
          `;
    taskcontainer.appendChild(div);
  });
}

async function toggleTask(taskId) {
  if (!isAuthenticated) {
    showPopup("Please sign in first!", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: taskId }),
    });

    const data = await response.json();
    if (data.success) {
      if (data.task && data.task.completed) {
        showPopup("Congratulations! You completed this task.", "success");
      }
      await getTasks(); // refresh task list after update
    } else {
      showPopup("Failed to update task", "error");
    }
  } catch (error) {
    console.error("Error toggling task:", error);
  }
}

async function deleteTask(taskId) {
  if (!isAuthenticated) {
    showPopup("Please sign in first!", "warning");
    return;
  }

  if (!confirm("Delete this task?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
    if (data.success) {
      await getTasks(); // refresh after delete
    } else {
      showPopup("Failed to delete task", "error");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

function openEdit(index) {
  currentIndex = index;
  document.getElementById("editInput").value = todoList[index].text;
  openModal("editModal");
}

function saveEdit() {
  const val = document.getElementById("editInput").value;
  if (val.trim()) {
    todoList[currentIndex].text = val.trim();
    renderTasks();
    closeAllModals();
  }
}

// Close modal when clicking outside the content box
window.onclick = (e) => {
  if (e.target.classList.contains("modal")) closeAllModals();
};

taskinput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addtaskbtn.click();
});
