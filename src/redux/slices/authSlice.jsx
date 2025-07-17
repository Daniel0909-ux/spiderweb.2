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
    // --- Step A: Fetch networks ---
    // The `unwrapResult` function is a good practice to handle potential errors.
    const networksAction = await dispatch(fetchNetworks());
    // If networks failed, stop the whole chain.
    if (fetchNetworks.rejected.match(networksAction)) {
      console.error("Failed to fetch networks, stopping initial data load.");
      return;
    }
    const networkIds = getState().networks.ids; // getState() is safe here as it was the first await.

    // --- Step B: Fetch core sites ---
    if (networkIds.length === 0) {
      console.log("No networks found, stopping.");
      return;
    }

    // IMPORTANT CHANGE: Capture the result of the dispatch
    const coreSitesAction = await dispatch(fetchAllCoreSites(networkIds));

    // Check if it was successful and get the payload directly from the action
    if (fetchAllCoreSites.rejected.match(coreSitesAction)) {
      console.error("Failed to fetch core sites, stopping initial data load.");
      return;
    }
    // THE FIX: Use the payload from the resolved action, NOT getState().
    const allCoreSites = coreSitesAction.payload; // This is the array of all sites.
    const coreSiteIds = allCoreSites.map((site) => site.id);

    // --- Step C: Fetch core devices ---
    if (coreSiteIds.length === 0) {
      console.log("No core sites found, stopping device fetch.");
      return;
    }

    // IMPORTANT CHANGE (Same pattern): Capture the result
    const coreDevicesAction = await dispatch(fetchAllCoreDevices(coreSiteIds));

    if (fetchAllCoreDevices.rejected.match(coreDevicesAction)) {
      console.error(
        "Failed to fetch core devices, stopping initial data load."
      );
      return;
    }
    // THE FIX: Use the payload from the resolved action.
    const allCoreDevices = coreDevicesAction.payload; // This is the array of all devices.
    const coreDeviceIds = allCoreDevices.map((device) => device.id);

    // --- Step D: Fetch all links for the core devices ---
    if (coreDeviceIds.length > 0) {
      await dispatch(fetchAllLinks(coreDeviceIds));
    }

    // --- Step E: Fetch any other independent data ---
    dispatch(fetchSites()); // Assuming this is for end-sites
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
