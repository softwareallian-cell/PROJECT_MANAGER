import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import teamReducer from "./slices/teamSlice";
import taskReducer from "./slices/taskSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        projects: projectReducer,
        teams: teamReducer,
        tasks: taskReducer,
        ui: uiReducer,
    },
});
