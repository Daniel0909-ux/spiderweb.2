import {
  createSlice,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { initialData } from "../initialData";

//import { api } from "../../services/apiServices"; // <-- To be used for the real API

// --- MOCK API: Mimics the real API call using dummy data ---
const mockApi = {
  getSites: async () => {
    // Simulate a network delay for a realistic loading experience
    await new Promise((resolve) => setTimeout(resolve, 300));
    // The data from initialData.sites is now an object, not a direct array
    return initialData.sites;
  },
};

/**
 * Normalizer Function (The "Bouncer")
 * Takes the raw API response and returns a clean, guaranteed array of site items.
 * This is the defensive layer that prevents the app from crashing.
 * @param {any} apiResponse - The raw data from action.payload.
 * @returns {Array} A safe array of site objects.
 */
const normalizeSitesApiResponse = (apiResponse) => {
  // Check for the most likely structure: an object with a 'data' array inside.
  if (apiResponse && Array.isArray(apiResponse.data)) {
    return apiResponse.data;
  }

  // Fallback check: Did the API just return a plain array?
  if (Array.isArray(apiResponse)) {
    console.warn(
      "Sites API returned a direct array. Normalizer handled it, but API structure may have changed."
    );
    return apiResponse;
  }

  // If neither of the above, the data is in an unknown format.
  // Log a warning and return a safe empty array to prevent crashes.
  console.warn(
    "Could not normalize sites API response. Data format is unexpected:",
    apiResponse
  );
  return [];
};

// --- ASYNC THUNK: For fetching the sites ---
export const fetchSites = createAsyncThunk(
  "sites/fetchSites",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getSites();
      // const response = await api.getSites(); // <-- Use this for the real API
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice Definition ---
const sitesSlice = createSlice({
  name: "sites",
  initialState: {
    items: [], // Start with an empty array for the sites
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  // Reducers for synchronous, direct state mutations
  reducers: {
    addSite: (state, action) => {
      const existingSite = state.items.find(
        (site) => site.id === action.payload.id
      );
      if (!existingSite) {
        state.items.push(action.payload);
      }
    },
    deleteSite: (state, action) => {
      const siteIdToRemove = action.payload;
      state.items = state.items.filter((site) => site.id !== siteIdToRemove);
    },
    updateSite: (state, action) => {
      const { id, ...updatedFields } = action.payload;
      const siteIndex = state.items.findIndex((site) => site.id === id);
      if (siteIndex !== -1) {
        state.items[siteIndex] = {
          ...state.items[siteIndex],
          ...updatedFields,
        };
      }
    },
  },
  // extraReducers handle the lifecycle of the `fetchSites` async thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchSites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Use the normalizer to safely extract the array from the payload
        state.items = normalizeSitesApiResponse(action.payload);
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- Export Actions ---
export const { addSite, deleteSite, updateSite } = sitesSlice.actions;

// --- Export Selectors ---
export const selectAllSites = (state) => state.sites.items;

export const selectSiteById = (state, siteId) =>
  state.sites.items.find((site) => site.id === siteId);

// --- MEMOIZED SELECTOR for filtering sites by device ID ---
const selectSitesItems = (state) => state.sites.items;
const selectDeviceId = (state, deviceId) => deviceId;

export const selectSitesByDeviceId = createSelector(
  [selectSitesItems, selectDeviceId],
  (allSites, deviceId) => {
    if (!deviceId) return [];
    return allSites.filter((site) => site.device_id === deviceId);
  }
);

// --- Export Reducer ---
export default sitesSlice.reducer;
