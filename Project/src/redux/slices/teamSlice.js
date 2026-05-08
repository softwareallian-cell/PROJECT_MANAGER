import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { WORKSPACES_URL, TEAMS_URL } from "../constants";

export const fetchWorkspaces = createAsyncThunk("workspaces/fetchAll", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(WORKSPACES_URL);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const fetchTeams = createAsyncThunk("teams/fetchByWorkspace", async (workspaceId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${WORKSPACES_URL}/${workspaceId}/teams`);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const addTeam = createAsyncThunk("teams/add", async (teamData, { rejectWithValue }) => {
    try {
        const res = await axios.post(TEAMS_URL, teamData);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const deleteTeamDb = createAsyncThunk("teams/delete", async (teamId, { rejectWithValue }) => {
    try {
        await axios.delete(`${TEAMS_URL}/${teamId}`);
        return teamId;
    } catch (err) { return rejectWithValue(err.message); }
});

export const updateTeamDb = createAsyncThunk("teams/update", async ({ id, updatedData }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${TEAMS_URL}/${id}`, updatedData);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const addTeamMemberDb = createAsyncThunk("teams/addMember", async ({ teamId, userId }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${TEAMS_URL}/${teamId}/members`, { userId });
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

export const removeTeamMemberDb = createAsyncThunk("teams/removeMember", async ({ teamId, userId }, { rejectWithValue }) => {
    try {
        const res = await axios.delete(`${TEAMS_URL}/${teamId}/members/${userId}`);
        return res.data;
    } catch (err) { return rejectWithValue(err.message); }
});

const teamSlice = createSlice({
    name: "teams",
    initialState: {
        workspaces: [],
        teams: [],
        activeWorkspaceId: null,
        activeTeamId: null,
        status: "idle",
        error: null,
    },
    reducers: {
        setActiveWorkspace: (state, action) => {
            state.activeWorkspaceId = action.payload;
        },
        setActiveTeam: (state, action) => {
            state.activeTeamId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.workspaces = action.payload;
                if (action.payload.length > 0) {
                    const exists = action.payload.find(w => w._id === state.activeWorkspaceId);
                    if (!state.activeWorkspaceId || !exists) {
                        state.activeWorkspaceId = action.payload[0]._id;
                    }
                }
            })
            .addCase(fetchTeams.fulfilled, (state, action) => {
                state.teams = action.payload;
                if (action.payload.length > 0) {
                    const exists = action.payload.find(t => t._id === state.activeTeamId);
                    if (!state.activeTeamId || !exists) {
                        state.activeTeamId = action.payload[0]._id;
                    }
                } else {
                    state.activeTeamId = null;
                }
            })
            .addCase(addTeam.fulfilled, (state, action) => {
                state.teams.push(action.payload);
                state.activeTeamId = action.payload._id;
            })
            .addCase(deleteTeamDb.fulfilled, (state, action) => {
                state.teams = state.teams.filter(t => t._id !== action.payload);
                if (state.activeTeamId === action.payload) {
                    state.activeTeamId = state.teams.length > 0 ? state.teams[0]._id : null;
                }
            })
            .addCase(updateTeamDb.fulfilled, (state, action) => {
                const idx = state.teams.findIndex(t => t._id === action.payload._id);
                if (idx !== -1) state.teams[idx] = action.payload;
            })
            .addCase(addTeamMemberDb.fulfilled, (state, action) => {
                const idx = state.teams.findIndex(t => t._id === action.payload._id);
                if (idx !== -1) state.teams[idx] = action.payload;
            })
            .addCase(removeTeamMemberDb.fulfilled, (state, action) => {
                const idx = state.teams.findIndex(t => t._id === action.payload._id);
                if (idx !== -1) state.teams[idx] = action.payload;
            })
            // Loading and Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending") && (action.type.startsWith("teams/") || action.type.startsWith("workspaces/")),
                (state) => {
                    state.status = "loading";
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected") && (action.type.startsWith("teams/") || action.type.startsWith("workspaces/")),
                (state, action) => {
                    state.status = "failed";
                    state.error = action.payload;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled") && (action.type.startsWith("teams/") || action.type.startsWith("workspaces/")),
                (state) => {
                    state.status = "succeeded";
                }
            );
    },
});

export const { setActiveWorkspace, setActiveTeam } = teamSlice.actions;
export default teamSlice.reducer;
