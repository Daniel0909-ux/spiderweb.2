import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialData } from "../initialData";

// Mock API
const mockApi = {
  getSites: async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return initialData.sites;
  },
};

export const fetchSites = createAsyncThunk(
  "sites/fetchSites",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getSites();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const sitesSlice = createSlice({
  name: "sites",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSites.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- EXPORTS ---
export const selectAllSites = (state) => state.sites.items;

// --- THIS IS THE FIX ---
// Add the status and error selectors that the rest of the app now expects.
export const selectSitesStatus = (state) => state.sites.status;
export const selectSitesError = (state) => state.sites.error;
// --- END FIX ---

export default sitesSlice.reducer;
