// src/redux/slices/sitesSlice.js

import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { logout } from "./authSlice";

// --- ENTITY ADAPTER for efficient state management of all end-sites ---
const sitesAdapter = createEntityAdapter();

const initialState = sitesAdapter.getInitialState({
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

/**
 * Fetches the initial list of all end-sites (basic info).
 * This will be called on app startup.
 */
export const fetchSites = createAsyncThunk(
  "sites/fetchSites",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getEndSites();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetches the detailed information for a single end-site.
 * This will be called on-demand (e.g., when viewing a site's detail page).
 */
export const fetchSiteDetails = createAsyncThunk(
  "sites/fetchSiteDetails",
  async (siteId, { rejectWithValue }) => {
    try {
      const response = await api.getEndSiteById(siteId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const sitesSlice = createSlice({
  name: "sites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Reducers for the main list fetch
      .addCase(fetchSites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use `setAll` to populate the store with the basic site list
        sitesAdapter.setAll(
          state,
          Array.isArray(action.payload) ? action.payload : []
        );
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Reducer for the detailed fetch. Note: It doesn't change the main status.
      .addCase(fetchSiteDetails.fulfilled, (state, action) => {
        // `upsertOne` will add the site if it's not present, or update it
        // with the new detailed fields if it is. This is the key benefit.
        sitesAdapter.upsertOne(state, action.payload);
      })

      // Reducer for logout
      .addCase(logout.type, () => initialState);
  },
});

// --- EXPORT SELECTORS ---
export const {
  selectAll: selectAllSites,
  selectById: selectSiteById,
  selectIds: selectSiteIds,
} = sitesAdapter.getSelectors((state) => state.sites);

export const selectSitesStatus = (state) => state.sites.status;
export const selectSitesError = (state) => state.sites.error;

export default sitesSlice.reducer;
