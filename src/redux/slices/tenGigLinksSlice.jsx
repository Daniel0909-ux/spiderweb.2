import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialData } from "../initialData"; // Assuming you have mock data
import { createSelector } from "@reduxjs/toolkit";

// Mock API
const mockApi = {
  getTenGigLinks: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return initialData.tenGigLinks;
  },
};

export const fetchTenGigLinks = createAsyncThunk(
  "tenGigLinks/fetchTenGigLinks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mockApi.getTenGigLinks();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const tenGigLinksSlice = createSlice({
  name: "tenGigLinks",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // This is for the real-time update simulation
    updateTenGigLink: (state, action) => {
      const { id, status } = action.payload;
      const existingLink = state.items.find((link) => link.id === id);
      if (existingLink) {
        existingLink.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenGigLinks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTenGigLinks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTenGigLinks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { updateTenGigLink } = tenGigLinksSlice.actions;

// --- EXPORTS ---
export const selectAllTenGigLinks = (state) => state.tenGigLinks.items;

// --- THIS IS THE FIX ---
// Add the status and error selectors that the rest of the app now expects.
export const selectTenGigLinksStatus = (state) => state.tenGigLinks.status;
export const selectTenGigLinksError = (state) => state.tenGigLinks.error;
// --- END FIX ---

// Selector for filtering links by network type ID
const selectLinkItems = (state) => state.tenGigLinks.items;
const selectTypeId = (state, typeId) => typeId;

export const selectLinksByTypeId = createSelector(
  [selectLinkItems, selectTypeId],
  (links, typeId) => {
    if (!typeId) return [];
    return Array.isArray(links)
      ? links.filter((link) => link.network_type_id === typeId)
      : [];
  }
);

export default tenGigLinksSlice.reducer;
