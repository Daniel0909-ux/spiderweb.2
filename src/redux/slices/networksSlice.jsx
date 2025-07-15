// src/redux/slices/networksSlice.js

import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { api } from "../../services/apiServices";
import { logout } from "./authSlice";

/**
 * Normalizer Function
 * Safely processes the raw API response and guarantees a clean array.
 * @param {any} apiResponse - The raw data from the API call.
 * @returns {Array<{id: string|number, name: string}>} A safe array of Network objects.
 */
const normalizeNetworksApiResponse = (apiResponse) => {
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }
  console.warn(
    "Could not normalize Networks API response. Expected an array, received:",
    apiResponse
  );
  return [];
};

// --- ENTITY ADAPTER for efficient state management ---
const networksAdapter = createEntityAdapter({
  // The API returns 'id' and 'name', so this default is fine, but being explicit is good.
  selectId: (network) => network.id,
});

const initialState = networksAdapter.getInitialState({
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

export const fetchNetworks = createAsyncThunk(
  "networks/fetchNetworks",
  async (_, { rejectWithValue }) => {
    try {
      // Use the new, real API service
      const response = await api.getNetworks();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- THE SLICE DEFINITION ---
const networksSlice = createSlice({
  name: "networks",
  initialState,
  reducers: {}, // No synchronous reducers needed for now
  extraReducers: (builder) => {
    builder
      // --- Reducers for Fetching ---
      .addCase(fetchNetworks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNetworks.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use the adapter and normalizer to safely set all items
        networksAdapter.setAll(
          state,
          normalizeNetworksApiResponse(action.payload)
        );
      })
      .addCase(fetchNetworks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // --- Reducer for Logout ---
      .addCase(logout.type, () => {
        // Reset the slice to its initial empty state on logout
        return initialState;
      });
  },
});

// --- EXPORT SELECTORS ---
// The adapter provides memoized selectors for free
export const {
  selectAll: selectAllNetworks,
  selectById: selectNetworkById,
  selectIds: selectNetworkIds,
} = networksAdapter.getSelectors((state) => state.networks);

// Also export status and error selectors for the UI to use
export const selectNetworksStatus = (state) => state.networks.status;
export const selectNetworksError = (state) => state.networks.error;

// --- EXPORT REDUCER ---
export default networksSlice.reducer;
