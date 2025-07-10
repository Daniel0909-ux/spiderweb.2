import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { initialData } from "../initialData";
import { logout } from "./authSlice";

// import { api } from "../../services/api"; // To be used for the real API

// --- MOCK API: Simulates the backend API calls for NetTypes ---
const mockApi = {
  getNetTypes: async () => {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Fast fetch
    return initialData.netTypes;
  },
  addNetType: async (netTypeData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Adding NetType...", netTypeData);
    const newNetType = { ...netTypeData, id: Date.now() };
    return newNetType;
  },
  deleteNetType: async (netTypeId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Deleting NetType with ID:", netTypeId);
    return { success: true };
  },
};

/**
 * Normalizer Function (The "Bouncer")
 * Safely processes the raw API response and guarantees a clean array.
 * @param {any} apiResponse - The raw data from action.payload.
 * @returns {Array} A safe array of NetType objects.
 */
const normalizeNetTypesApiResponse = (apiResponse) => {
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }
  console.warn(
    "Could not normalize NetTypes API response. Expected an array, received:",
    apiResponse
  );
  return [];
};

// --- ENTITY ADAPTER for efficient state management ---
const netTypesAdapter = createEntityAdapter({
  selectId: (netType) => netType.id,
});

const initialState = netTypesAdapter.getInitialState({
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

export const fetchNetTypes = createAsyncThunk(
  "netTypes/fetchNetTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getNetTypes();
      // const response = await api.getNetTypes(); // Use this for the real API
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addNetType = createAsyncThunk(
  "netTypes/addNetType",
  async (netTypeData, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.addNetType(netTypeData);
      // await api.addNetType(netTypeData); // Use this for the real API

      // On success, re-fetch the entire list to ensure data consistency
      dispatch(fetchNetTypes());
      return netTypeData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNetType = createAsyncThunk(
  "netTypes/deleteNetType",
  async (netTypeId, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.deleteNetType(netTypeId);
      // await api.deleteNetType(netTypeId); // Use this for the real API

      // On success, re-fetch the list to reflect the deletion
      dispatch(fetchNetTypes());
      return netTypeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- THE SLICE DEFINITION ---
const netTypesSlice = createSlice({
  name: "netTypes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- Reducers for Fetching ---
      .addCase(fetchNetTypes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNetTypes.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use the adapter and normalizer to safely set all items
        netTypesAdapter.setAll(
          state,
          normalizeNetTypesApiResponse(action.payload)
        );
      })
      .addCase(fetchNetTypes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // --- Reducer for Logout ---
      .addCase(logout, () => {
        // Reset the slice to its initial empty state on logout
        return initialState;
      });
  },
});

// --- EXPORT SELECTORS ---
// The adapter provides memoized selectors for free
export const {
  selectAll: selectAllNetTypes,
  selectById: selectNetTypeById,
  selectIds: selectNetTypeIds,
} = netTypesAdapter.getSelectors((state) => state.netTypes);

// Also export status and error selectors for the UI to use
export const selectNetTypesStatus = (state) => state.netTypes.status;
export const selectNetTypesError = (state) => state.netTypes.error;

// --- EXPORT REDUCER ---
export default netTypesSlice.reducer;
