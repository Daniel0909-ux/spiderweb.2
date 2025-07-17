// src/redux/slices/coreSitesSlice.js

import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { api } from "../../services/apiServices";
import { logout } from "./authSlice";

// --- ENTITY ADAPTER for efficient state management of all core sites ---
const coreSitesAdapter = createEntityAdapter({
  selectId: (site) => site.id,
});

const initialState = coreSitesAdapter.getInitialState({
  // We'll track which site IDs belong to each network
  sitesByNetworkId: {}, // { [networkId]: string[] }
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

/**
 * Fetches all core sites for a SINGLE given network ID.
 * This is the new, dependent thunk.
 */
export const fetchCoreSitesForNetwork = createAsyncThunk(
  "coreSites/fetchForNetwork",
  async (networkId, { rejectWithValue }) => {
    try {
      const sites = await api.getCoreSitesByNetwork(networkId);
      // Return both the sites and the networkId so the reducer knows where to map them
      return { networkId, sites: Array.isArray(sites) ? sites : [] };
    } catch (error) {
      return rejectWithValue({ networkId, message: error.message });
    }
  }
);

/**
 * A "master" thunk to fetch core sites for ALL provided network IDs.
 * This will be called by our main data orchestrator.
 */
export const fetchAllCoreSites = createAsyncThunk(
  "coreSites/fetchAll",
  async (networkIds, { dispatch, rejectWithValue }) => {
    try {
      // Create an array of dispatch promises
      const fetchPromises = networkIds.map((id) =>
        dispatch(fetchCoreSitesForNetwork(id))
      );
      // Wait for all of them to settle (either fulfilled or rejected)
      await Promise.all(fetchPromises);
    } catch (error) {
      // This catch block might not be strictly necessary if the individual
      // thunks handle their own errors, but it's good for safety.
      return rejectWithValue(error.message);
    }
  }
);

// --- NEW: Add Core Site Thunk ---
export const addCoreSite = createAsyncThunk(
  "coreSites/addCoreSite",
  async (siteData, { dispatch, rejectWithValue }) => {
    // siteData must include the parent networkId, e.g., { name: 'Site A', network_id: 1 }
    try {
      await api.addCoreSite(siteData);
      // Re-fetch only the sites for the affected network
      dispatch(fetchCoreSitesForNetwork(siteData.network_id));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- NEW: Delete Core Site Thunk ---
export const deleteCoreSite = createAsyncThunk(
  "coreSites/deleteCoreSite",
  async (payload, { dispatch, rejectWithValue }) => {
    // Payload must be an object: { siteId: 123, networkId: 1 }
    const { siteId, networkId } = payload;
    try {
      await api.deleteCoreSite(siteId);
      // Re-fetch the list for the parent network
      dispatch(fetchCoreSitesForNetwork(networkId));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- THE SLICE DEFINITION ---
const coreSitesSlice = createSlice({
  name: "coreSites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // --- THIS IS THE FIX: Each .addCase is a separate statement ---
    builder.addCase(fetchAllCoreSites.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchAllCoreSites.fulfilled, (state) => {
      state.status = "succeeded";
    });
    builder.addCase(fetchAllCoreSites.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(fetchCoreSitesForNetwork.fulfilled, (state, action) => {
      const { networkId, sites } = action.payload;
      coreSitesAdapter.upsertMany(state, sites);
      state.sitesByNetworkId[networkId] = sites.map((site) => site.id);
    });
    builder.addCase(logout.type, () => {
      return initialState;
    });
  },
});

// --- EXPORT SELECTORS ---
export const { selectAll: selectAllCoreSites, selectById: selectCoreSiteById } =
  coreSitesAdapter.getSelectors((state) => state.coreSites);

export const selectCoreSitesStatus = (state) => state.coreSites.status;
export const selectCoreSitesError = (state) => state.coreSites.error;

// New memoized selector to get all core sites for a specific network ID
export const selectCoreSitesByNetworkId = createSelector(
  // Input selectors
  [
    (state) => state.coreSites.entities,
    (state) => state.coreSites.sitesByNetworkId,
    (state, networkId) => networkId,
  ],
  // Output selector
  (entities, sitesByNetworkId, networkId) => {
    const siteIds = sitesByNetworkId[networkId] || [];
    return siteIds.map((id) => entities[id]).filter(Boolean); // filter(Boolean) removes any undefined if an ID is invalid
  }
);

export default coreSitesSlice.reducer;
