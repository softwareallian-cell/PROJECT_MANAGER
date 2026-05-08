import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL, USERS_URL } from "../constants";

export const updateProjectDetails = createAsyncThunk(
    "projects/updateDetails",
    async ({ id, field, value }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`${API_URL}/${id}`, { [field]: value });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message || "Update failed");
        }
    }
);

export const fetchCreatedProjects = createAsyncThunk("projects/fetchCreated", async (userId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}/created/${userId}`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Fetch failed");
    }
});

export const fetchAssignedProjects = createAsyncThunk("projects/fetchAssigned", async (userId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${API_URL}/assigned/${userId}`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Fetch failed");
    }
});

export const addProjectDb = createAsyncThunk("projects/add", async (projectData, { rejectWithValue }) => {
    try {
        const res = await axios.post(API_URL, projectData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Add failed");
    }
});

export const editProjectDb = createAsyncThunk("projects/edit", async ({ id, updatedData }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, updatedData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Edit failed");
    }
});

export const deleteProjectDb = createAsyncThunk("projects/delete", async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Delete failed");
    }
});

export const assignProjectDb = createAsyncThunk("projects/assign", async ({ projectId, assignToUserId }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${API_URL}/${projectId}/assign`, { assignToUserId });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Assign failed");
    }
});

export const removeAssigneeDb = createAsyncThunk("projects/removeAssignee", async ({ projectId, userId }, { rejectWithValue }) => {
    try {
        const res = await axios.delete(`${API_URL}/${projectId}/assign/${userId}`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Remove failed");
    }
});

export const fetchTimeSessions = createAsyncThunk(
    "timesessions/fetch",
    async (projectId, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/${projectId}/timesessions`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchAllTimeSessions = createAsyncThunk(
    "timesessions/fetchAllUser",
    async (userId, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${USERS_URL}/${userId}/timesessions`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

const projectSlice = createSlice({
    name: "projects",
    initialState: {
        createdProjects: [],
        assignedProjects: [],
        timeSessions: [],
        allTimeSessions: [],
        status: "idle",
        error: null,
    },
    reducers: {
        clearProjects: (state) => {
            state.createdProjects = [];
            state.assignedProjects = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCreatedProjects.fulfilled, (state, action) => {
                state.createdProjects = action.payload;
            })
            .addCase(fetchAssignedProjects.fulfilled, (state, action) => {
                state.assignedProjects = action.payload;
            })
            .addCase(addProjectDb.fulfilled, (state, action) => {
                state.createdProjects.push(action.payload);
            })
            .addCase(editProjectDb.fulfilled, (state, action) => {
                const createdIndex = state.createdProjects.findIndex(p => p._id === action.payload._id);
                if (createdIndex !== -1) state.createdProjects[createdIndex] = action.payload;

                const assignedIndex = state.assignedProjects.findIndex(p => p._id === action.payload._id);
                if (assignedIndex !== -1) state.assignedProjects[assignedIndex] = action.payload;
            })
            .addCase(deleteProjectDb.fulfilled, (state, action) => {
                state.createdProjects = state.createdProjects.filter(p => p._id !== action.payload);
                state.assignedProjects = state.assignedProjects.filter(p => p._id !== action.payload);
            })
            .addCase(assignProjectDb.fulfilled, (state, action) => {
                const index = state.createdProjects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) state.createdProjects[index] = action.payload;
            })
            .addCase(removeAssigneeDb.fulfilled, (state, action) => {
                const index = state.createdProjects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) state.createdProjects[index] = action.payload;
            })
            .addCase(updateProjectDetails.fulfilled, (state, action) => {
                const createdIndex = state.createdProjects.findIndex(p => p._id === action.payload._id);
                if (createdIndex !== -1) state.createdProjects[createdIndex] = action.payload;

                const assignedIndex = state.assignedProjects.findIndex(p => p._id === action.payload._id);
                if (assignedIndex !== -1) state.assignedProjects[assignedIndex] = action.payload;
            })
            .addCase(fetchTimeSessions.fulfilled, (state, action) => {
                state.timeSessions = action.payload;
            })
            .addCase(fetchAllTimeSessions.fulfilled, (state, action) => {
                state.allTimeSessions = action.payload;
            })
            // Loading and Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending") && action.type.startsWith("projects/"),
                (state) => {
                    state.status = "loading";
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected") && action.type.startsWith("projects/"),
                (state, action) => {
                    state.status = "failed";
                    state.error = action.payload;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled") && action.type.startsWith("projects/"),
                (state) => {
                    state.status = "succeeded";
                }
            );
    },
});

export const { clearProjects } = projectSlice.actions;
export default projectSlice.reducer;
