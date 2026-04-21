# AlianHub Task OS

A high-performance, full-stack project management platform built for modern teams. AlianHub Task OS combines a premium glassmorphic aesthetic with robust tracking features, real-time analytics, and secure cloud storage.

![Premium UI Showcase](https://via.placeholder.com/1200x600/0e0e1e/f2aa4d?text=AlianHub+Task+OS+-+Glassmorphic+Interface)

## 🚀 Key Features

- **Premium AI-Native UI**: Extreme glassmorphism, smooth animations, and a sophisticated navy/amber palette.
- **Floating Time Tracker**: Real-time work session logging on subtasks with random screenshot captures via `getDisplayMedia()`.
- **Integrated Time Logs**: Full session history with screenshot evidence, stored efficiently in MongoDB GridFS.
- **Kanban & Gantt Views**: Visualize your project timeline and task status across multiple interactive views.
- **Dynamic Dashboard**: Real-time project statistics, task completion rates, and personalized welcome banners.
- **Attachment System**: Secure file storage for project assets using GridFS (zero external S3 dependencies).
- **Subtask Ecosystem**: Detailed checklists, milestones, and granular progress tracking.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Redux Toolkit, React Router v6
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB Atlas (Cloud Storage with GridFS)
- **Styling**: Vanilla CSS (Custom Glassmorphism engine)

## 📦 Project Structure

```bash
PROJECT_MANAGER/
├── BACKEND/backend/   # Express API, Mongoose Models, GridFS Config
└── Project/           # React Frontend (Vite)
```

## 🚥 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (for cloud DB)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/softwareallian-cell/PROJECT_MANAGER.git
   cd PROJECT_MANAGER
   ```

2. **Setup Backend**:
   ```bash
   cd BACKEND/backend
   npm install
   # Create a .env file with your MONGODB_URI
   npm start
   ```

3. **Setup Frontend**:
   ```bash
   cd Project
   npm install
   npm run dev
   ```

---

*Built with ❤️ by the AlianHub Team.*
