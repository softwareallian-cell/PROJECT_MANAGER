# AlianHub Backend — Node.js & Express

This directory contains the central API for the AlianHub Task OS. It handles authentication, project management, and high-performance time tracking data.

## 🛠️ Tech Stack
- **Framework**: Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Storage**: MongoDB GridFS (for both attachments and screenshots)
- **Middleware**: multer (memory storage), cors, express.json

## 🛰️ API Endpoints Summary

### Projects & Auth
- `POST /api/users/login` / `signup`: Authentication handlers.
- `GET /api/projects`: Retrieve projects for current user.
- `POST /api/projects`: Create new project.

### Time Tracker (New)
- `POST /api/timesessions`: Initialize a tracking session.
- `PUT /api/timesessions/:id/pause`: Pause an active session.
- `PUT /api/timesessions/:id/stop`: Finalize and save session data.
- `POST /api/timesessions/:id/screenshot`: Upload a captured PNG to GridFS.
- `GET /api/screenshots/:fileId`: Stream a screenshot image.

## 📂 Key Files
- `server.js`: The unified API server entry point.
- `models/`: Mongoose schemas (Projects, Users, TimeSessions).

## 🚀 Development
```bash
npm install
npm start
```
