import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { USERS_URL } from "../constants";

export const signupUser = createAsyncThunk("auth/signup", async (userData, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${USERS_URL}/signup`, userData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Signup failed");
    }
});

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${USERS_URL}/login`, credentials);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
    }
});

export const googleLogin = createAsyncThunk("auth/googleLogin", async (token, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${USERS_URL}/google-login`, { token });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Google Login failed");
    }
});

export const updateProfile = createAsyncThunk("auth/update", async ({ id, updatedData }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${USERS_URL}/${id}`, updatedData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Update failed");
    }
});

export const deleteProfile = createAsyncThunk("auth/delete", async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`${USERS_URL}/${id}`);
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Delete failed");
    }
});

export const fetchNotifications = createAsyncThunk("auth/fetchNotifications", async (userId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${USERS_URL}/${userId}/notifications`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const markNotificationsRead = createAsyncThunk("auth/markNotificationsRead", async (userId, { rejectWithValue }) => {
    try {
        await axios.put(`${USERS_URL}/${userId}/notifications/read`);
        return true;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const searchUsers = createAsyncThunk("auth/search", async (q, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${USERS_URL}/search`, { params: { q } });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message || "Search failed");
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        currentUser: JSON.parse(localStorage.getItem("CURRENTUSER"))?.[0] || null,
        notifications: [],
        userSearchResults: [],
        status: "idle",
        error: null,
    },
    reducers: {
        logoutUser: (state) => {
            state.currentUser = null;
            state.notifications = [];
            state.userSearchResults = [];
            localStorage.removeItem("CURRENTUSER");
            localStorage.removeItem("activeTracker");
            localStorage.removeItem("tracker_session");
        },
        clearUserSearch: (state) => {
            state.userSearchResults = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.fulfilled, (state, action) => {
                state.currentUser = action.payload;
                localStorage.setItem("CURRENTUSER", JSON.stringify([action.payload]));
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.currentUser = action.payload;
                localStorage.setItem("CURRENTUSER", JSON.stringify([action.payload]));
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.currentUser = action.payload;
                localStorage.setItem("CURRENTUSER", JSON.stringify([action.payload]));
            })
            .addCase(deleteProfile.fulfilled, (state) => {
                state.currentUser = null;
                state.notifications = [];
                localStorage.removeItem("CURRENTUSER");
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.notifications = action.payload;
            })
            .addCase(markNotificationsRead.fulfilled, (state) => {
                state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
            })
            .addCase(searchUsers.fulfilled, (state, action) => {
                state.userSearchResults = action.payload;
            })
            // Loading and Error Handling
            .addMatcher(
                (action) => action.type.endsWith("/pending") && action.type.startsWith("auth/"),
                (state) => {
                    state.status = "loading";
                    state.error = null;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/rejected") && action.type.startsWith("auth/"),
                (state, action) => {
                    state.status = "failed";
                    state.error = action.payload;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith("/fulfilled") && action.type.startsWith("auth/"),
                (state) => {
                    state.status = "succeeded";
                }
            );
    },
});

export const { logoutUser, clearUserSearch } = authSlice.actions;
export default authSlice.reducer;
