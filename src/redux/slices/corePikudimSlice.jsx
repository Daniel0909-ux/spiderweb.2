import {
  createSlice,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { initialData } from "../initialData";

// import { api } from "../../services/apiServices"; // To be used for the real API

// --- MOCK API: Simulates the backend API calls ---
const mockApi = {
  getCorePikudim: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // The dummy data currently returns a direct array. Our normalizer will handle this
    // and also be ready for a future change where it might be nested.
    return initialData.corePikudim;
  },
  addCoreSite: async (siteData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Adding core site...", siteData);
    // Real API would return the newly created object with its ID
    return { ...siteData, id: Date.now(), timestamp: new Date().toISOString() };
  },
  deleteCoreSite: async (siteId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Deleting core site with ID:", siteId);
    return { success: true };
  },
};

/**
 * Normalizer Function (The "Bouncer")
 * Safely processes the raw API response and guarantees a clean array.
 * @param {any} apiResponse - The raw data from action.payload.
 * @returns {Array} A safe array of Pikudim/Core Site objects.
 */
const normalizePikudimApiResponse = (apiResponse) => {
  // Check for common nested structures (e.g., { data: [...] } or { pikudim: [...] })
  if (apiResponse && Array.isArray(apiResponse.data)) {
    return apiResponse.data;
  }
  if (apiResponse && Array.isArray(apiResponse.pikudim)) {
    return apiResponse.pikudim;
  }

  // Fallback for a direct array response (like our current mock data)
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }

  // If the format is unknown, log a warning and return a safe empty array.
  console.warn(
    "Could not normalize Core Pikudim API response. Data format is unexpected:",
    apiResponse
  );
  return [];
};

// --- ASYNC THUNKS ---

// 1. For FETCHING the initial list of Pikudim (Core Sites)
export const fetchCorePikudim = createAsyncThunk(
  "corePikudim/fetchCorePikudim",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getCorePikudim();
      // const response = await api.getCorePikudim(); // Use this for the real API
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 2. For ADDING a new Core Site
export const addCoreSite = createAsyncThunk(
  "corePikudim/addCoreSite",
  async (siteData, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.addCoreSite(siteData);
      // await api.addCorePikudim(siteData); // Use this for the real API

      // On success, re-fetch the entire list to ensure data consistency.
      // This is a simple and reliable "pessimistic" update approach.
      dispatch(fetchCorePikudim());
      return siteData; // Return original data for potential UI feedback
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. For DELETING a Core Site
export const deleteCoreSite = createAsyncThunk(
  "corePikudim/deleteCoreSite",
  async (siteId, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.deleteCoreSite(siteId);
      // await api.deleteCorePikudim(siteId); // Use this for the real API

      // On success, re-fetch the list to reflect the deletion.
      dispatch(fetchCorePikudim());
      return siteId; // Return the deleted ID for potential UI feedback
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice Definition ---
const corePikudimSlice = createSlice({
  name: "corePikudim",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCorePikudim.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCorePikudim.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use the normalizer to safely update the state
        state.items = normalizePikudimApiResponse(action.payload);
      })
      .addCase(fetchCorePikudim.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- Export Selectors ---
export const selectAllPikudim = (state) => state.corePikudim.items;
export const selectCorePikudimStatus = (state) => state.corePikudim.status;
export const selectCorePikudimError = (state) => state.corePikudim.error;

export const selectPikudimById = (state, pikudimId) =>
  state.corePikudim.items.find((p) => p.id === pikudimId);

const selectPikudimItems = (state) => state.corePikudim.items;
const selectTypeId = (state, typeId) => typeId;

export const selectPikudimByTypeId = createSelector(
  [selectPikudimItems, selectTypeId],
  (pikudim, typeId) => {
    if (!typeId) return [];
    // Ensure `pikudim` is an array before filtering
    return Array.isArray(pikudim)
      ? pikudim.filter((p) => p.type_id === typeId)
      : [];
  }
);

// --- Export Reducer ---
export default corePikudimSlice.reducer;
