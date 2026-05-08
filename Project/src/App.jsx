import React, { useEffect } from "react"
import SignUpPage from './Components/SignupPage'
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom"
import DashBoard from "./Components/DashBoard"
import LoginPage from "./Components/LoginPage"
import Projects from "./Components/Projects"
import Details from "./Components/Details"
import TrackerWidget from "./Components/TrackerWidget"
import { GuestGuard, LoginGuard, ProjectGuard } from "./Components/Guards"
import EditProfile from "./Components/EditProfile";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "./redux/slices/authSlice";
import { fetchAssignedProjects, fetchCreatedProjects } from "./redux/slices/projectSlice";
import TimeSheet from "./Components/TimeSheet"
import Project_1 from "./Components/Project_1"

function App() {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.ui.mode);
  useEffect(() => {
    document.body.className = mode;
  }, [mode]);
  const currentUser = JSON.parse(localStorage.getItem("CURRENTUSER"));
  useEffect(() => {

    if (currentUser?.[0]?._id) {
      const userId = currentUser[0]._id;
      dispatch(fetchCreatedProjects(userId));
      dispatch(fetchAssignedProjects(userId));
      dispatch(fetchNotifications(userId));
    }
  }, [dispatch, currentUser]);

    const activeTracker = useSelector((state) => state.ui.activeTracker);
  return (<>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUpPage />} />

        <Route element={<GuestGuard />} >
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<LoginGuard />} >
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/profile" element={<EditProfile />} />
          <Route path="/timesheet" element={<TimeSheet />} />
          <Route path="/linear" element={<Project_1 />} />


          <Route element={<ProjectGuard />} >
            <Route path="/projects/:id" element={<Details />} />
          </Route>
        </Route>

        <Route path="/*" element={<h1>404 NOT FOUND</h1>} />
      </Routes>

      <TrackerWidget key={activeTracker ? `${activeTracker.projectId}-${activeTracker.subtaskIndex}` : "idle"} />
    </BrowserRouter >
  </>
  )
}

export default App
