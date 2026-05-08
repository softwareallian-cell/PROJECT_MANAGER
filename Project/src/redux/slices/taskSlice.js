import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { TEAMS_URL, TASKS_URL, API_URL } from "../constants";

export const fetchTasks = createAsyncThunk("tasks/fetchByTeam", async (teamId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${TEAMS_URL}/${teamId}/tasks`);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const addTaskDb = createAsyncThunk("tasks/add", async (taskData, { rejectWithValue }) => {
    try {
        const res = await axios.post(TASKS_URL, taskData);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const editTaskDb = createAsyncThunk("tasks/edit", async ({ id, updatedData }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${TASKS_URL}/${id}`, updatedData);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const deleteTaskDb = createAsyncThunk("tasks/delete", async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`${TASKS_URL}/${id}`);
        return id;
    } catch (err) { return rejectWithValue(err.message); }
});

export const fetchProjectsByTeam = createAsyncThunk("linearProjects/fetchByTeam", async (teamId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${TEAMS_URL}/${teamId}/projects`);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const addProjectByTeam = createAsyncThunk("linearProjects/add", async (projectData, { rejectWithValue }) => {
    try {
        const res = await axios.post(API_URL, projectData);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

const taskSlice = createSlice({
    name: "tasks",
    initialState: {
        tasks: [],
        linearProjects: [],
        activeProjectId: null,
        status: "idle",
        error: null,
    },
    reducers: {
        setActiveProject: (state, action) => {
            state.activeProjectId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.tasks = action.payload;
            })
            .addCase(addTaskDb.fulfilled, (state, action) => {
                state.tasks.unshift(action.payload);
            })
            .addCase(editTaskDb.fulfilled, (state, action) => {
                const idx = state.tasks.findIndex(t => t._id === action.payload._id);
                if (idx !== -1) state.tasks[idx] = action.payload;
            })
            .addCase(deleteTaskDb.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(t => t._id !== action.payload);
            })
            .addCase(fetchProjectsByTeam.fulfilled, (state, action) => {
                state.linearProjects = action.payload;
            })
            .addCase(addProjectByTeam.fulfilled, (state, action) => {
                state.linearProjects.push(action.payload);
            })
            // Loading and Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending") && (action.type.startsWith("tasks/") || action.type.startsWith("linearProjects/")),
                (state) => {
                    state.status = "loading";
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected") && (action.type.startsWith("tasks/") || action.type.startsWith("linearProjects/")),
                (state, action) => {
                    state.status = "failed";
                    state.error = action.payload;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled") && (action.type.startsWith("tasks/") || action.type.startsWith("linearProjects/")),
                (state) => {
                    state.status = "succeeded";
                }
            );
    },
});

export const { setActiveProject } = taskSlice.actions;
export default taskSlice.reducer;
