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

// --- NEW: Add Network Thunk ---
export const addNetwork = createAsyncThunk(
  "networks/addNetwork",
  async (networkData, { dispatch, rejectWithValue }) => {
    try {
      // Assuming api service has an `addNetwork` method
      await api.addNetwork(networkData);
      // On success, re-fetch the entire list to ensure consistency
      dispatch(fetchNetworks());
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- NEW: Delete Network Thunk ---
export const deleteNetwork = createAsyncThunk(
  "networks/deleteNetwork",
  async (networkId, { dispatch, rejectWithValue }) => {
    try {
      // Assuming api service has a `deleteNetwork` method
      await api.deleteNetwork(networkId);
      // On success, re-fetch the list
      dispatch(fetchNetworks());
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- THE SLICE DEFINITION ---
const networksSlice = createSlice({
  name: "networks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // --- THIS IS THE FIX: Each .addCase is a separate statement ---
    builder.addCase(fetchNetworks.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchNetworks.fulfilled, (state, action) => {
      state.status = "succeeded";
      networksAdapter.setAll(
        state,
        normalizeNetworksApiResponse(action.payload)
      );
    });
    builder.addCase(fetchNetworks.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(logout.type, () => {
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
