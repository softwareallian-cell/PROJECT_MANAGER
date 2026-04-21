# TASK-PLAN — Time Tracker Feature
> Status: ✅ COMPLETE (Refined)
> Last updated: 2026-04-21  
> Completed: 2026-04-20 (Phase 1), 2026-04-21 (Phase 2 Premium Polish)  
> Changes from v2: Screenshot storage updated from "disk files" → GridFS (MongoDB Atlas)

---

## What We Are Building

A **floating time tracker widget** that lives inside the existing app window.

- Triggered by `[▶ Track]` button on any subtask in the Project Details page
- Displayed as a **fixed-position panel** (bottom-right corner) — toggleable show/hide
- Takes **real screenshots** via `getDisplayMedia()` — one permission grant per session, then silent captures every 3–7 minutes
- Sessions + screenshots saved to **MongoDB Atlas via GridFS** (same system as existing file attachments)

---

## User Flow

```
[Details Page — /projects/:id]
  Subtask row: "Fix login bug"   [▶ Track]
        │ click
        ▼
[FLOATING WIDGET — Screen 1: Confirmation]
  ┌─────────────────────────────────┐
  │  ✕               Start Tracker  │
  │  Task:    Fix login bug         │
  │  Project: AlianHub              │
  │  Sprint:  3                     │
  │  Comment: [________________]    │
  │           [Close] [Start ▶]     │
  └─────────────────────────────────┘
        │ click Start ▶
        │ → getDisplayMedia() fires (one-time OS picker)
        │ → POST /api/timesessions (create session in DB)
        ▼
[WIDGET — Screen 2: Active Timer]
  ┌─────────────────────────────────┐
  │  📁 AlianHub / Fix login bug    │
  │  Current Session                │
  │  0h : 04m : 32s        [⏸]     │
  │  "Starting"            [✏️]     │
  │  Latest Screen Capture          │
  │  [thumbnail of last screenshot] │
  │            [■ Stop & Save]      │
  └─────────────────────────────────┘
        │ click Stop
        │ → PUT /api/timesessions/:id/stop
        │ → stream released
        ▼
[WIDGET — Screen 3: Summary]
  ┌─────────────────────────────────┐
  │  Session Saved ✓                │
  │  Total: 0h 04m 32s              │
  │  Screenshots taken: 2           │
  │  [Close Widget]                 │
  └─────────────────────────────────┘
```

**Toggle button** (always visible, bottom-right corner):
- Widget hidden → shows `[⏱]` icon button
- Widget visible → shows full panel
- Session active + widget collapsed → button **pulses amber** as a live indicator

---

## Screenshot Strategy — `getDisplayMedia()` + GridFS

### How it works
```
1. User clicks "Start Tracker"
2. Browser shows OS picker: [Entire Screen / Window / Tab] — user picks ONCE
3. We hold the video stream silently in the background
4. Every 3–7 minutes (random): grab a frame → convert to PNG blob → POST to backend
5. Backend streams PNG into GridFS (MongoDB Atlas) → stores GridFS file ID in session
6. Widget shows the latest screenshot thumbnail (fetched via GET /api/screenshots/:fileId)
7. On Stop → stream released, session finalised
```

### What gets captured
| User picks in OS dialog | What we capture |
|---|---|
| Entire Screen | Full desktop — VS Code, Figma, all apps |
| Window | Just that one application window |
| Browser Tab | Only that browser tab |

### Frame capture code (frontend)
```js
// One-time on session start:
const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

// Each random interval:
const track = stream.getVideoTracks()[0];
const imageCapture = new ImageCapture(track);
const bitmap = await imageCapture.grabFrame();

const canvas = document.createElement('canvas');
canvas.width = bitmap.width;
canvas.height = bitmap.height;
canvas.getContext('2d').drawImage(bitmap, 0, 0);
canvas.toBlob(async (blob) => {
  const formData = new FormData();
  formData.append('screenshot', blob, 'screenshot.png');
  await fetch(`/api/timesessions/${sessionId}/screenshot`, {
    method: 'POST', body: formData
  });
}, 'image/png');
```

---

## Storage Architecture

### Your existing system (attachments)
```
User uploads file
  → multer (memoryStorage) buffers it
  → Readable.from(buffer).pipe(gridfsBucket.openUploadStream())
  → File stored in GridFS (MongoDB Atlas cloud)
  → Project.attachments[].path = GridFS file ID (string)
  → Retrieve: GET /api/attachments/:fileId → gridfsBucket.openDownloadStream()
```

### Screenshots (identical pattern)
```
Screenshot PNG blob captured
  → POST /api/timesessions/:id/screenshot (multipart/form-data)
  → multer (memoryStorage) buffers it
  → Readable.from(buffer).pipe(gridfsBucket.openUploadStream())
  → File stored in GridFS (MongoDB Atlas cloud)
  → TimeSession.screenshots[].gridfsId = GridFS file ID (string)
  → Retrieve: GET /api/screenshots/:fileId → gridfsBucket.openDownloadStream()
```

**Zero new infrastructure needed.** GridFS bucket already initialised in server.js.

---

## Files to Create

| File | Purpose |
|---|---|
| `BACKEND/backend/models/TimeSession.js` | Mongoose model for time sessions |
| `Project/src/Components/TrackerWidget.jsx` | Floating widget — 3 screens + timer + screenshot logic |
| `Project/src/Components/TrackerWidget.css` | Dark panel UI matching screenshots provided |

---

## Files to Modify

| File | What Changes |
|---|---|
| `BACKEND/backend/server.js` | 5 new API endpoints for time sessions + screenshot upload/download |
| `Project/src/Components/Details.jsx` | `[▶ Track]` button per subtask + `<TrackerWidget>` + "⏱ Time Log" tab |
| `Project/src/Components/Redux.jsx` | `fetchTimeSessions` thunk + `timeSessions: []` state field |

### No changes needed
- `App.jsx` — no new route required ✅
- `.env` — no new env vars required ✅
- MongoDB Atlas — GridFS bucket already exists ✅

---

## Backend — New API Endpoints

```
POST   /api/timesessions
         Body: { projectId, subtaskIndex, subtaskTitle, userId, comment }
         Response: created TimeSession document

PUT    /api/timesessions/:id/pause
         Body: { totalSeconds }
         Response: updated TimeSession

PUT    /api/timesessions/:id/stop
         Body: { totalSeconds }
         Response: updated TimeSession (status: 'stopped')

POST   /api/timesessions/:id/screenshot
         Body: multipart/form-data — field: 'screenshot' (PNG blob)
         → streams into GridFS, appends { capturedAt, gridfsId } to session.screenshots[]
         Response: { gridfsId }

GET    /api/projects/:projectId/timesessions
         Response: array of TimeSession documents for the project

GET    /api/screenshots/:fileId
         → streams GridFS file as image/png (same as existing /api/attachments/:fileId)
```

---

## TimeSession Mongoose Schema

```js
// BACKEND/backend/models/TimeSession.js
const mongoose = require('mongoose');

const TimeSessionSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  subtaskIndex: { type: Number, required: true },
  subtaskTitle: { type: String, required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, required: true },
  comment:      { type: String, default: '' },
  startedAt:    { type: Date,   default: Date.now },
  totalSeconds: { type: Number, default: 0 },
  status:       { type: String, enum: ['active','paused','stopped'], default: 'active' },
  screenshots:  [{
    capturedAt: { type: Date, default: Date.now },
    gridfsId:   { type: String, required: true }   // GridFS file ID, same as attachments
  }]
});

module.exports = mongoose.model('TimeSession', TimeSessionSchema);
```

---

## Redux Additions

```js
// New thunk
export const fetchTimeSessions = createAsyncThunk(
  'timesessions/fetch',
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/${projectId}/timesessions`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// New initial state field:  timeSessions: []

// New reducer case:
.addCase(fetchTimeSessions.fulfilled, (state, action) => {
  state.timeSessions = action.payload;
})
```

---

## Details.jsx Changes

### 1. Subtask row — Track button + time badge
```
☐ Fix login bug            [▶ Track]    ⏱ 1h 24m
☐ Write unit tests         [▶ Track]    ⏱ 0h 00m
```

### 2. New "⏱ Time Log" tab (7th tab)
```
| Date       | Subtask          | Duration | Comment    | Screenshot |
| 2026-04-20 | Fix login bug    | 1h 24m   | "Starting" |  [thumb]   |
| 2026-04-19 | Write unit tests | 0h 45m   | "Review"   |  [thumb]   |

Total tracked on this project: 2h 09m
```

### 3. TrackerWidget rendered at root of Details
```jsx
{trackerSubtask && (
  <TrackerWidget
    subtaskIndex={trackerSubtask.index}
    subtaskTitle={trackerSubtask.title}
    project={project}
    onClose={() => setTrackerSubtask(null)}
    onSessionSaved={() => dispatch(fetchTimeSessions(project._id))}
  />
)}
```

---

## TrackerWidget Internal State Machine

```
IDLE
  ↓ [▶ Track] clicked on a subtask
CONFIRM   (show: task info + comment field + [Close] [Start ▶])
  ↓ [Start ▶] → getDisplayMedia() → POST /api/timesessions
ACTIVE    (live timer + screenshot interval running)
  ↓ [⏸ Pause] → PUT .../pause
PAUSED    (timer frozen, interval cleared, stream held)
  ↓ [▶ Resume] → restart interval
  ↓ [■ Stop] → PUT .../stop → stream.getTracks().forEach(t => t.stop())
SUMMARY   (show: total time + screenshot count + [Close])
  ↓ [Close] → onSessionSaved() callback → setTrackerSubtask(null)
IDLE
```

---

## Confirmed Decisions

| Decision | Chosen |
|---|---|
| Screenshot storage | **GridFS (MongoDB Atlas)** — same as existing attachments |
| Screenshot capture | **`getDisplayMedia()`** — one-time permission, silent random frames |
| Screenshot interval | **3–7 minutes random** |
| Widget location | **Floating panel, fixed bottom-right, same window** |
| Who can track | Any logged-in user who can view the project |
| Auth in widget | Full Redux access (same window, same store) |
| New route needed | ❌ No |
| New infrastructure | ❌ No — GridFS + multer already set up |

---

## Build Order

1. `TimeSession.js` — Mongoose model  
2. `server.js` — 5 new endpoints  
3. `Redux.jsx` — thunk + state  
4. `TrackerWidget.css` — UI styles  
5. `TrackerWidget.jsx` — full widget component  
6. `Details.jsx` — wire up widget + buttons + Time Log tab  

---

## Acceptance Criteria

- [x] `[▶ Track]` on every subtask in Details page
- [x] Widget appears fixed bottom-right, toggleable with `[⏱]` button
- [x] Confirmation screen shows project, task, sprint pre-filled + comment field
- [x] `getDisplayMedia()` fires on "Start Tracker" click
- [x] Live timer (hh:mm:ss) runs after permission granted
- [x] Screenshots captured at random 3–7 min intervals, latest shown in widget
- [x] Screenshot stored in GridFS, thumbnail retrieved from `/api/screenshots/:id`
- [x] Pause saves elapsed seconds to DB
- [x] Stop finalises session, releases screen capture stream
- [x] "⏱ Time Log" tab shows all sessions — date, subtask, duration, comment, screenshot
- [x] Subtask rows show total logged time per subtask
- [x] Widget pulses amber when session active and widget is collapsed
- [x] No crash if user closes widget during active session

---

## Out of Scope

- ❌ Team-level time report / manager dashboard  
- ❌ Idle detection / activity score  
- ❌ Billing or invoicing from hours  
- ❌ Mobile responsive tracker widget  
