# VibeCheck ToDo App Documentation

## Project Overview

This project is a full-stack ToDo application with:

- Frontend: plain HTML, CSS, and JavaScript
- Backend: Node.js, Express, MongoDB, and Mongoose
- Authentication: JWT stored in secure `httpOnly` cookies
- Google login support
- Daily progress history page for user tasks

## What changed

### Backend

- Added secure authentication with JWT cookies
- Added Google sign-in route and verification
- Added task routes protected with auth middleware
- Added MongoDB connection logic that supports Atlas or local DB
- Added `.env.example` for configuration

### Frontend

- Switched from token in `localStorage` to cookie-based auth
- Used `credentials: "include"` on protected fetch calls
- Added login status check on page load
- Added congratulations popup when task is completed
- Separated main page (today tasks) from history page (`daily.html`)
- Added delete restriction for history items older than 2 days

## Project files and folders

### Root folder

- `.gitignore` - lists files/folders Git should ignore, including `.env`, `node_modules`, and certs.
- `README.md` - project documentation and setup instructions.
- `package-lock.json` - lockfile created by npm to preserve exact dependency versions.
- `index.html` - main task page where users add and view today’s tasks.
- `daily.html` - daily history page showing tasks grouped by date.
- `script.js` - frontend logic for login, task creation, toggle, delete, and popups.
- `daily.js` - frontend logic for daily task history, date grouping, and delete rules.
- `styles.css` - main page styling.
- `daily.css` - daily page styling.

### Backend folder

- `backend/.env` - runtime environment variables; this file should stay local and untracked.
- `backend/.env.example` - configuration template showing the required environment variables.
- `backend/package.json` - backend dependencies and npm scripts.
- `backend/package-lock.json` - exact backend dependency tree for reproducible installs.
- `backend/node_modules/` - installed backend packages; this folder should remain ignored and not committed.
- `backend/certs/` - local HTTPS certificates; ignored by git and used only for local dev when HTTPS is enabled.
- `backend/EXPLANATION.txt` - existing project explanation and notes.
- `backend/generate-cert.js` - helper script to create local self-signed certificates for HTTPS.

#### Backend configuration

- `backend/config/db.js` - connection logic for MongoDB. It uses `process.env.MONGODB_URL` for Atlas or falls back to local MongoDB if needed.

#### Backend middleware

- `backend/middleware/auth.js` - auth guard for protected routes. It extracts the JWT from cookies, verifies it, loads the user, and attaches `req.user`.

#### Backend models

- `backend/models/user.js` - defines the user schema with `name`, `email`, `password`, and optional `googleId`. Passwords are stored hashed.
- `backend/models/task.js` - defines the task schema with fields for `task`, `completed`, `user`, `createdAt`, and `completedAt`.

#### Backend routes

- `backend/routes/auth.js` - handles registration, login, logout, status, and Google sign-in.
- `backend/routes/tasks.js` - handles task creation, listing, completion toggling, and deletion.

#### Backend startup

- `backend/app.js` - builds the Express app, configures CORS, JSON parsing, static file serving, routes, and error handling.
- `backend/server.js` - starts the server, reads cert files if available, and logs the server URL.

### Why each file exists

- `index.html` provides the main user interface for adding today’s tasks and viewing current to-dos.
- `daily.html` provides the history interface where tasks are grouped by the day they were created.
- `script.js` handles login state, protected API requests, task creation, toggling, deletion, and UI updates on the main page.
- `daily.js` handles daily history loading, grouping tasks by date, and restricting deletion to recent tasks.
- `styles.css` and `daily.css` style the application pages and make the UI look consistent.
- `backend/.env.example` documents the required backend configuration without exposing secrets.
- `backend/config/db.js` makes the project Atlas-ready while still supporting local MongoDB for development.
- `backend/middleware/auth.js` protects API routes so only authenticated users can access their own tasks.
- `backend/routes/auth.js` manages authentication flows and cookie issuance.
- `backend/routes/tasks.js` manages the task API used by both the main page and the daily history page.
- `backend/app.js` is the centralized server configuration file.
- `backend/server.js` is the actual entry point that starts the HTTP(S) server.

## File-specific code details

- `backend/app.js` sets `app.set("trust proxy", 1)` so cookies can work correctly behind proxies and cloud hosts.
- `backend/routes/auth.js` uses secure `httpOnly` JWT cookies to avoid exposing auth tokens to browser JavaScript.
- `backend/routes/tasks.js` reads `req.user.id` from the auth middleware so users only see their own tasks.
- `script.js` uses `credentials: "include"` on fetch calls to send the JWT cookie to the backend.
- `daily.js` groups tasks by `createdAt` date and shows older history entries with a `Locked` label when they are too old to delete.

## How task flow works

### Main page (`index.html`)

- Shows only tasks created today
- Uses `GET /api/tasks` and filters tasks by today’s date
- Adds new tasks with `POST /api/tasks`
- Toggles completion with `PUT /api/tasks`
- Deletes tasks with `DELETE /api/tasks/:id`

### Daily history page (`daily.html`)

- Loads all user tasks from `GET /api/tasks`
- Groups tasks by creation date
- Shows full history of user tasks
- Allows delete only for tasks created in the last 2 days
- Older history entries are shown as `Locked`

## Important data and auth flow

### Register

- `POST /api/auth/register`
- Hashes password with `bcryptjs`
- Saves user
- Issues JWT cookie

### Login

- `POST /api/auth/login`
- Verifies email and password
- Issues JWT cookie

### Status

- `GET /api/auth/status`
- Verifies JWT cookie and returns auth state

### Logout

- `POST /api/auth/logout`
- Clears the JWT cookie

### Google login

- `POST /api/auth/google`
- Verifies Google ID token
- Finds or creates user
- Issues JWT cookie
- Uses Google Identity frontend flow and backend verification with `google-auth-library`
- Requires a Google OAuth Client ID stored in `GOOGLE_CLIENT_ID`

## Google auth setup

- Created a Google Cloud project and enabled OAuth consent for the app
- Generated a Web OAuth 2.0 Client ID in Google Cloud Console
- Added that Client ID to `backend/.env` as `GOOGLE_CLIENT_ID`
- Frontend uses the Google Identity SDK to sign in and send the ID token to the backend
- Backend verifies the token, creates or updates the user, then issues the same secure JWT cookie as email/password auth

## Environment configuration

Use `backend/.env.example` to create your real `.env` file. Do not commit `.env`.
Example variables:

```ini
MONGODB_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
NODE_ENV=development
PORT=5000
```

## Git and sensitive file handling

### What happened with nested Git

The `backend/` directory contained its own nested `.git` repository, which caused this issue:

- root repo only saw `backend/` as a directory
- root `git status` did not show individual backend files

### Fix applied

- Removed `backend/.git`
- root Git now tracks backend files normally

### Safe files to commit

Your `.gitignore` already covers:

- `*.env`
- `/backend/node_modules/`
- `/backend/certs/`
- `.vscode/`

This means sensitive files like `.env` and local certs are excluded.

### Safe commit workflow

From the project root:

```powershell
cd "C:\Users\ASUS\Desktop\personal learning\todolist"
git add .
git status --short
git commit -m "Add backend and frontend project files"
git push
```

### If you want to preview files first

```powershell
git add --dry-run .
```

### To verify ignored files

```powershell
git check-ignore -v backend/.env
git check-ignore -v backend/certs/localhost.key.pem
```

## How to run the project locally

### Backend

```powershell
cd "C:\Users\ASUS\Desktop\personal learning\todolist\backend"
npm install
npm run dev
```

### HTTPS support

The backend can start with local HTTPS if cert files exist in `backend/certs`:

- `backend/certs/localhost.key.pem`
- `backend/certs/localhost.crt.pem`

If certificates are missing, the server starts in HTTP mode and prints:

```text
⚠️ HTTPS certificate not found. Generate it with `npm run gen-cert`.
```

To generate local certs:

```powershell
cd "C:\Users\ASUS\Desktop\personal learning\todolist\backend"
npm run gen-cert
```

Then restart the server with `npm run dev`.

### Frontend

Open `index.html` in the browser, or visit the backend server if static files are served from Express.

## Problems encountered and solutions

### Problem 1: Backend folder not showing files in Git

- Issue: `git status` on the root only showed `backend/` and not the files inside.
- Cause: `backend/` contained its own nested `.git` repository.
- Solution: Removed `backend/.git` so the root repository can track backend files normally.

### Problem 2: Daily history showed all past tasks instead of daily summaries

- Issue: The daily progress page displayed every old task, making history confusing.
- Cause: `daily.js` loaded all tasks and grouped them without respecting daily history semantics.
- Solution: Updated the logic to show history grouped by date and only allow deletion within the allowed window.

### Problem 3: Main page showed yesterday’s tasks instead of just today’s tasks

- Issue: The main task page still displayed older tasks.
- Cause: `script.js` loaded all tasks from the backend without filtering by today's date.
- Solution: Added a filter in `getTasks()` so only tasks created today appear on the main page.

### Problem 4: Auth state was inconsistent between pages

- Issue: The app sometimes failed to authenticate requests on the daily page.
- Cause: The main app used cookie-based auth, while `daily.js` still expected a token in `localStorage`.
- Solution: Updated `daily.js` to use `credentials: "include"` and cookie auth like the main page.

### Problem 5: Sensitive files must not be pushed

- Issue: Concern about committing `.env` or cert files.
- Solution: Confirmed `.gitignore` covers `*.env`, `/backend/node_modules/`, `/backend/certs/`, and `.vscode/`, and added safe git commands.

## Final notes

- Keep `backend/.env` untracked
- Keep `backend/.env.example` if you want a config template
- Keep `backend/certs/` ignored unless you intentionally add certs for local HTTPS
- `package.json` is required and should be committed because it defines dependencies and scripts

## What I learned and where it is used

- **Node.js**: used in the backend server code, working with `require`, `process.env`, and `npm` package management.
- **Express**: used in `backend/app.js` to create the app, define routes, enable middleware, parse JSON, and serve static files.
- **MongoDB / Mongoose**: used in `backend/config/db.js`, `backend/models/user.js`, and `backend/models/task.js` to connect to the database and define schemas.
- **JWT authentication**: used in `backend/routes/auth.js` to issue tokens, and `backend/middleware/auth.js` to protect routes and identify users.
- **Cookies and CORS**: used in `backend/app.js` and `script.js` to send secure `httpOnly` cookies with `credentials: "include"`.
- **Google login**: used in `backend/routes/auth.js` with `google-auth-library` and in the frontend Google Identity flow to sign users in.
- **Frontend JavaScript**: used in `script.js` to handle login state, task creation, toggling, deletion, and popups; and in `daily.js` to build the daily history view.
- **Git and repo management**: used by fixing the nested `backend/.git` issue, using `.gitignore` correctly, and applying safe `git add` / `git commit` practices.

If you want, I can also add a short `CONTRIBUTING.md` or a second file with step-by-step developer setup instructions.
