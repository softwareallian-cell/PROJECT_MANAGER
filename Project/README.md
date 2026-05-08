# Project-Management-Tool Frontend — React & Vite

This directory contains the user interface for Project-Management-Tool Task OS, featuring a premium glassmorphic design and integrated time tracking tools.

## 🛠️ Tech Stack
- **Library**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Vanilla CSS (Custom Glassmorphism framework)

## ✨ UI Features
- **Glassmorphic Navigation**: Sidebar and header with translucent blur effects.
- **Dynamic Dashboard**: Personalized stats and progress tracking.
- **Subtask Time Tracker**: Fixed-position widget for recording work sessions with visual feedback.
- **Kanban & Gantt**: Specialized views for project lifecycle management.
- **Premium Cards**: Standardized project cards with automatic text truncation and tooltips.

## 📂 Key Components
- `src/Components/TrackerWidget.jsx`: The core time tracking engine.
- `src/Components/Redux.jsx`: The unified state slice for the entire app.
- `src/Components/Details.jsx`: The master view for project deep-dives.

## 🚀 Development
```bash
npm install
npm run dev
```

## 🎨 Styling Conventions
The app uses a suite of CSS variables defined in central stylesheets to maintain the "Premium OS" aesthetic:
- `--glass-blur`: 12px blur for translucent panels.
- `--accent-amber`: #f2aa4d for branding and primary actions.
- `--card-bg`: Dark translucent background for containers.
