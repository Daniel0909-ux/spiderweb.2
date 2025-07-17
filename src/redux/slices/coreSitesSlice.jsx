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
  // We'll track which site IDs belong to each network for filtering
  sitesByNetworkId: {}, // { [networkId]: string[] }
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

/**
 * CHILD THUNK: Fetches all core sites for a SINGLE given network ID.
 * This is dispatched by the master thunk and can also be used for targeted updates.
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
 * MASTER THUNK: Fetches core sites for ALL provided network IDs.
 * This is the main thunk called by the app initializer. It collects all data
 * and returns it in a single payload for the main reducer to handle.
 */
export const fetchAllCoreSites = createAsyncThunk(
  "coreSites/fetchAll",
  async (networkIds, { dispatch, rejectWithValue }) => {
    try {
      // Create an array of dispatch promises
      const fetchPromises = networkIds.map((id) =>
        dispatch(fetchCoreSitesForNetwork(id))
      );
      // Wait for all of them to settle and get their results
      const results = await Promise.all(fetchPromises);

      // Filter out any rejected promises and extract the 'sites' payload from the fulfilled ones.
      // `flatMap` is used to combine the arrays of sites into a single flat array.
      const allSites = results
        .filter((result) => fetchCoreSitesForNetwork.fulfilled.match(result))
        .flatMap((result) => result.payload.sites);

      // Return one single, combined array of all sites.
      // This payload will be handled by the `fetchAllCoreSites.fulfilled` reducer.
      return allSites;
    } catch (error) {
      // This catch is for safety but individual thunks handle their own rejections.
      return rejectWithValue(error.message);
    }
  }
);

// --- CRUD Thunks (example of using the child thunk for targeted reloads) ---
export const addCoreSite = createAsyncThunk(
  "coreSites/addCoreSite",
  async (siteData, { dispatch, rejectWithValue }) => {
    // siteData must include parent network_id, e.g., { name: 'Site A', network_id: 1 }
    try {
      await api.addCoreSite(siteData);
      // Re-fetch only the sites for the affected network for an efficient update.
      dispatch(fetchCoreSitesForNetwork(siteData.network_id));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCoreSite = createAsyncThunk(
  "coreSites/deleteCoreSite",
  async (payload, { dispatch, rejectWithValue }) => {
    // Payload must be an object: { siteId: 123, networkId: 1 }
    const { siteId, networkId } = payload;
    try {
      await api.deleteCoreSite(siteId);
      // Re-fetch the list for the parent network.
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
    // --- Master Thunk Reducers ---
    builder.addCase(fetchAllCoreSites.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchAllCoreSites.fulfilled, (state, action) => {
      // `action.payload` is the flat array of all sites returned by the thunk.
      // `setAll` correctly populates BOTH `state.ids` and `state.entities`.
      // This is the key fix that allows the data-fetching chain to proceed.
      if (action.payload) {
        coreSitesAdapter.setAll(state, action.payload);
      }
      state.status = "succeeded";
    });
    builder.addCase(fetchAllCoreSites.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });

    // --- Child Thunk Reducer ---
    // This reducer is still useful. It runs for each network and populates
    // the `sitesByNetworkId` map, which is used by the `selectCoreSitesByNetworkId` selector.
    // It also ensures the state is up-to-date if you use `fetchCoreSitesForNetwork` directly.
    builder.addCase(fetchCoreSitesForNetwork.fulfilled, (state, action) => {
      const { networkId, sites } = action.payload;
      // We still upsert here to ensure the latest data is present.
      // This won't conflict with `setAll` because the data is the same.
      coreSitesAdapter.upsertMany(state, sites);
      // This populates our lookup map for the selector.
      state.sitesByNetworkId[networkId] = sites.map((site) => site.id);
    });

    // --- Logout Reducer ---
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

// This memoized selector to get all core sites for a specific network ID remains unchanged.
// It correctly uses the `sitesByNetworkId` map populated by the child thunk's reducer.
export const selectCoreSitesByNetworkId = createSelector(
  [
    (state) => state.coreSites.entities,
    (state) => state.coreSites.sitesByNetworkId,
    (state, networkId) => networkId,
  ],
  (entities, sitesByNetworkId, networkId) => {
    const siteIds = sitesByNetworkId[networkId] || [];
    return siteIds.map((id) => entities[id]).filter(Boolean);
  }
);

export default coreSitesSlice.reducer;
