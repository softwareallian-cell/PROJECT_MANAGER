# PROJECT-CONTEXT — AlianHub Task OS
> Last updated: 2026-04-21  
> Maintained by: Antigravity AI  

---

## What This Project Is

**AlianHub Task OS** — a high-performance, full-stack project management platform with a "premium" glassmorphic aesthetic.  
MERN stack: MongoDB Atlas · Express · React · Node.js  
Redux Toolkit for state management. GridFS for file storage (attachments & screenshots).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router v6 |
| Backend | Node.js, Express, Mongoose, GridFS, multer (memoryStorage) |
| Database | MongoDB Atlas (cloud) |
| Auth | Local Email/Password + Session-based protection |
| Styling | Vanilla CSS (Glassmorphism, CSS Variables, Modern Flex/Grid) |

---

## File Structure

```
PROJECT_MANAGER/
├── BACKEND/backend/
│   ├── server.js           ← Unified API (Projects, Auth, Time Log, GridFS)
│   ├── models/
│   │   ├── Projects.js
│   │   ├── User.js
│   │   └── TimeSession.js  ← Task tracking schema
│   └── .env
│
└── Project/src/
    ├── App.jsx             ← Global Routes & Theme Context
    └── Components/
        ├── Redux.jsx        ← Central State (Slices & Async Thunks)
        ├── DashBoard.jsx    ← Modernized with Stats & High-end UI
        ├── Projects.jsx     ← Card view with glassmorphism
        ├── Details.jsx      ← Tabbed interface + Tracker Integration
        ├── KanbanBoard.jsx
        ├── GanttView.jsx
        ├── TrackerWidget.jsx  ← Floating AI-native Time Tracker
        └── TrackerWidget.css  ← Premium dark aesthetic
```

---

## Design System — "Premium OS" Aesthetic

- **Theme Color Palette**: Deep Navy (#0e0e1e), Amber Accents (#f2aa4d), Emerald Success (#22c55e), Vibrant Red (#ef4444).
- **Visual Style**: Extreme glassmorphism (`backdrop-filter: blur(12px)`), subtle 1px borders, smooth CSS animations (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Typography**: System Inter/Roboto with heavy font weights (800+) for headers and labels.
- **UX Polish**: Automatic title truncation with hover tooltips for long project/task names.

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
| **Floating time tracker widget** | ✅ Done — Enhanced UI |
| **Screenshot capture (getDisplayMedia)** | ✅ Done — Optimized Captures |
| **Time Log tab in project details** | ✅ Done — Full Session History |

---

## Refinements & Bug Fixes (April 2026)

- **Tracker UX**: "Track" button now correctly disables when a session is already active for another task.
- **State Safety**: Resolved "Session Saved" summary persistent state when starting a new session immediately.
- **Layout Integrity**: Fixed text wrapping and overflow issues in Project Cards and Details Sidebar.
- **Infrastructure**: GridFS unified for both project attachments and tracker screenshots for zero-footprint storage.
- **Code Quality**: Migrated to React Fragments at root levels to avoid layout-breaking sibling wrappers.

---

## Known Limitations / Out of Scope

- No idle detection (requires system-level hooks)
- No team-level aggregate time reporting (planned)
- Passwords stored in database (JWT migration pending)
- Mobile tracker support (Native bridge required for screen capture)
- Billing/Invoicing logic

---

> Documentation maintained by Antigravity AI.
