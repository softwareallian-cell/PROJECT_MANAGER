import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { WORKSPACES_URL } from "../constants";

export const fetchWorkspaceMembers = createAsyncThunk(
    "workspace/fetchMembers",
    async (workspaceId, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${WORKSPACES_URL}/${workspaceId}/members`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const inviteWorkspaceMembers = createAsyncThunk(
    "workspace/inviteMembers",
    async ({ workspaceId, emails, teamIds }, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${WORKSPACES_URL}/${workspaceId}/invite`, { emails, teamIds });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const removeWorkspaceMember = createAsyncThunk(
    "workspace/removeMember",
    async ({ workspaceId, userId }, { rejectWithValue }) => {
        try {
            await axios.delete(`${WORKSPACES_URL}/${workspaceId}/members/${userId}`);
            return userId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const updateMemberRole = createAsyncThunk(
    "workspace/updateRole",
    async ({ workspaceId, userId, role }, { rejectWithValue }) => {
        try {
            const res = await axios.put(`${WORKSPACES_URL}/${workspaceId}/members/${userId}/role`, { role });
            return { userId, role };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

const workspaceSlice = createSlice({
    name: "workspace",
    initialState: {
        members: [],
        status: "idle",
        error: null,
    },
    reducers: {
        clearWorkspaceState: (state) => {
            state.members = [];
            state.status = "idle";
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
                state.members = action.payload;
            })
            .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
                state.members = state.members.filter(m => String(m.user._id) !== String(action.payload));
            })
            .addCase(updateMemberRole.fulfilled, (state, action) => {
                const member = state.members.find(m => String(m.user._id) === String(action.payload.userId));
                if (member) member.role = action.payload.role;
            })
            // Loading and Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending") && action.type.startsWith("workspace/"),
                (state) => {
                    state.status = "loading";
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected") && action.type.startsWith("workspace/"),
                (state, action) => {
                    state.status = "failed";
                    state.error = action.payload;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled") && action.type.startsWith("workspace/"),
                (state) => {
                    state.status = "succeeded";
                }
            );
    },
});

export const { clearWorkspaceState } = workspaceSlice.actions;
export default workspaceSlice.reducer;
