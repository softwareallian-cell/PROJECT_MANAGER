import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
    name: "ui",
    initialState: {
        mode: localStorage.getItem("theme") || "dark",
        activeTracker: JSON.parse(localStorage.getItem("activeTracker")) || null,
        trackerPanelOpen: true,
    },
    reducers: {
        toggleTheme: (state) => {
            state.mode = state.mode === "dark" ? "light" : "dark";
            localStorage.setItem("theme", state.mode);
        },
        startGlobalTracker: (state, action) => {
            state.activeTracker = action.payload;
            state.trackerPanelOpen = true;
            localStorage.setItem("activeTracker", JSON.stringify(action.payload));
        },
        stopGlobalTracker: (state) => {
            state.activeTracker = null;
            localStorage.removeItem("activeTracker");
            localStorage.removeItem("tracker_session");
        },
        setTrackerPanelOpen: (state, action) => {
            state.trackerPanelOpen = action.payload;
        },
    },
});

export const { toggleTheme, startGlobalTracker, stopGlobalTracker, setTrackerPanelOpen } = uiSlice.actions;
export default uiSlice.reducer;
