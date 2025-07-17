// src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { api } from "../../services/apiServices";
// --- CHANGE 1: Import the new `fetchNetworks` thunk ---
import { fetchNetworks } from "./networksSlice";
import { fetchAllCoreSites } from "./coreSitesSlice";
import { fetchAllCoreDevices } from "./coreDevicesSlice";
import { fetchSites } from "./sitesSlice";
import { fetchAllLinks } from "./linksSlice";

// This thunk's only job is to dispatch all the other data-fetching actions in parallel.
export const fetchInitialData = createAsyncThunk(
  "auth/fetchInitialData",
  async (_, { dispatch, getState }) => {
    // Step A: Fetch networks
    const networksAction = await dispatch(fetchNetworks());
    if (fetchNetworks.rejected.match(networksAction)) return;

    // Step B: Fetch core sites
    const networkIds = getState().networks.ids;
    if (networkIds.length > 0) {
      await dispatch(fetchAllCoreSites(networkIds));
    } else {
      return;
    }

    // Step C: Fetch core devices
    const coreSiteIds = getState().coreSites.ids;
    if (coreSiteIds.length > 0) {
      await dispatch(fetchAllCoreDevices(coreSiteIds));
    } else {
      return;
    }

    // Step D: Fetch all links for the core devices
    const coreDeviceIds = getState().coreDevices.ids;
    if (coreDeviceIds.length > 0) {
      await dispatch(fetchAllLinks(coreDeviceIds));
    }

    // Step E: Fetch any other independent data
    dispatch(fetchSites());
  }
);

// This is the primary thunk called by the LoginPage.
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, { dispatch, rejectWithValue }) => {
    try {
      const token = await api.login(username, password);

      // After a successful login, trigger the fetch for all initial app data.
      dispatch(fetchInitialData());

      // Return the token to be saved in the auth state
      return token;
    } catch (error) {
      // If login fails, pass the error message to the 'rejected' case
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: Cookies.get("authToken") || null,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.status = "idle";
      state.error = null;
      api.logout(); // Use the API service to remove the cookie
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

export const selectAuthToken = (state) => state.auth.token;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
