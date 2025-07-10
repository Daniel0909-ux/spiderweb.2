import {
  createSlice,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { initialData } from "../initialData";

// import { api } from "../../services/apiServices"; // To be used for the real API

// --- MOCK API: Simulates the backend API calls ---
const mockApi = {
  getTenGigLinks: async () => {
    // Simulate a network delay for a realistic loading experience
    await new Promise((resolve) => setTimeout(resolve, 350));
    // The data from initialData.tenGigLinks is already enriched
    return initialData.tenGigLinks;
  },
};

/**
 * Normalizer Function (The "Bouncer")
 * Safely processes the raw API response and guarantees a clean array.
 * @param {any} apiResponse - The raw data from action.payload.
 * @returns {Array} A safe array of 10-Gig link objects.
 */
const normalizeLinksApiResponse = (apiResponse) => {
  // Check for common nested structures
  if (apiResponse && Array.isArray(apiResponse.data)) {
    return apiResponse.data;
  }
  if (apiResponse && Array.isArray(apiResponse.links)) {
    return apiResponse.links;
  }

  // Fallback for a direct array response (like our current mock data)
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }

  // If the format is unknown, log a warning and return a safe empty array.
  console.warn(
    "Could not normalize 10-Gig Links API response. Data format is unexpected:",
    apiResponse
  );
  return [];
};

// --- ASYNC THUNK: For fetching the 10-Gigabit links ---
export const fetchTenGigLinks = createAsyncThunk(
  "tenGigLinks/fetchTenGigLinks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getTenGigLinks();
      // const response = await api.getTenGigLines(); // Use this for the real API
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice Definition ---
const tenGigLinksSlice = createSlice({
  name: "tenGigLinks",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  // Reducers for synchronous actions
  reducers: {
    addTenGigLink: (state, action) => {
      state.items.push(action.payload);
    },
    deleteTenGigLink: (state, action) => {
      const linkIdToRemove = action.payload;
      state.items = state.items.filter((link) => link.id !== linkIdToRemove);
    },
    updateTenGigLink: (state, action) => {
      const { id, ...updatedFields } = action.payload;
      const linkIndex = state.items.findIndex((link) => link.id === id);
      // Safely update only if the link exists in the current state
      if (linkIndex !== -1) {
        state.items[linkIndex] = {
          ...state.items[linkIndex],
          ...updatedFields,
        };
      }
    },
  },
  // extraReducers handle the lifecycle of the `fetchTenGigLinks` async thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenGigLinks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTenGigLinks.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use the normalizer to safely update the state
        state.items = normalizeLinksApiResponse(action.payload);
      })
      .addCase(fetchTenGigLinks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- Export Actions ---
export const { addTenGigLink, deleteTenGigLink, updateTenGigLink } =
  tenGigLinksSlice.actions;

// --- Export Selectors ---
export const selectAllTenGigLinks = (state) => state.tenGigLinks.items;
export const selectLinksStatus = (state) => state.tenGigLinks.status;
export const selectLinksError = (state) => state.tenGigLinks.error;

// --- MEMOIZED SELECTOR for filtering links by network type ID ---
const selectLinkItems = (state) => state.tenGigLinks.items;
const selectTypeIdFromLink = (state, typeId) => typeId;

export const selectLinksByTypeId = createSelector(
  [selectLinkItems, selectTypeIdFromLink],
  (links, typeId) => {
    if (!typeId) return [];
    // Ensure `links` is an array before filtering
    return Array.isArray(links)
      ? links.filter((l) => l.network_type_id === typeId)
      : [];
  }
);

// --- Export Reducer ---
export default tenGigLinksSlice.reducer;
