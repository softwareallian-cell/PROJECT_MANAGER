# PROJECT-CONTEXT — AlianHub Task OS
> Last updated: 2026-04-20  
> Maintained by: Antigravity AI  

---

## What This Project Is

**AlianHub Task OS** — a full-stack project management web app.  
MERN stack: MongoDB Atlas · Express · React · Node.js  
Redux Toolkit for all client state. GridFS for file storage (no S3).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router v6 |
| Backend | Node.js, Express, Mongoose, GridFS, multer (memoryStorage) |
| Database | MongoDB Atlas (cloud) |
| Auth | Plain email+password (no JWT yet) |

---

## File Structure

```
PROJECT_MANAGER/
├── BACKEND/backend/
│   ├── server.js           ← All API routes (single file)
│   ├── models/
│   │   ├── Projects.js
│   │   ├── User.js
│   │   └── TimeSession.js  ← Added in Task 10
│   └── .env
│
└── Project/src/
    ├── App.jsx             ← Routes
    └── Components/
        ├── Redux.jsx        ← Full Redux store (single slice)
        ├── DashBoard.jsx
        ├── Projects.jsx
        ├── Details.jsx      ← Modified in Task 10
        ├── KanbanBoard.jsx
        ├── GanttView.jsx
        ├── TrackerWidget.jsx  ← NEW — Task 10
        └── TrackerWidget.css  ← NEW — Task 10
```

---

## Conventions

- All backend API routes live in one file: `server.js`  
- All Redux logic lives in one file: `Redux.jsx`  
- GridFS bucket name: `uploads` — shared across attachments AND screenshots  
- multer config: `memoryStorage()`, 20MB limit, instance name `upload`  
- API base URL: `http://localhost:5000`  
- No .env vars added in Task 10 — GridFS bucket already existed  

---

## Features Built (cumulative)

| Feature | Status |
|---|---|
| User signup / login | ✅ Done |
| Create / edit / delete projects | ✅ Done |
| Assign projects to users | ✅ Done |
| Notifications system | ✅ Done |
| Subtasks, checklist, milestones | ✅ Done |
| File attachments (GridFS) | ✅ Done |
| Activity log | ✅ Done |
| Kanban board view | ✅ Done |
| Gantt chart view | ✅ Done |
| Dashboard with stats | ✅ Done |
| Dark/light theme toggle | ✅ Done |
| **Floating time tracker widget** | ✅ Done — Task 10 |
| **Screenshot capture (getDisplayMedia)** | ✅ Done — Task 10 |
| **Time Log tab in project details** | ✅ Done — Task 10 |

---

## Time Tracker — Technical Notes (Task 10)

- `TimeSession` schema: `projectId, subtaskIndex, subtaskTitle, userId, comment, startedAt, totalSeconds, status, screenshots[]`
- Screenshots stored in GridFS under the same `uploads` bucket as file attachments
- Screenshot retrieval: `GET /api/screenshots/:fileId` — streams GridFS file as `image/png`
- Widget state machine: `CONFIRM → ACTIVE ⇄ PAUSED → SUMMARY`
- Screenshot interval: random 3–7 minutes (per spec)
- `getDisplayMedia()` called once on session start — stream held silently in `streamRef`
- Widget uses local state + direct fetch calls — no Redux dispatch inside the widget itself
- `TrackerWidget` is mounted at `Details.jsx` root, inside a JSX fragment, outside `details-wrapper`

---

## Known Limitations / Out of Scope

- No idle detection
- No team-level time reports
- No JWT auth (passwords stored plain)
- Mobile not supported for tracker widget
- No billing/invoicing
