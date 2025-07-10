// src/redux/slices/alertsSlice.js  <-- Note the .js extension
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { generateMockAlerts } from "../dummyData";

//import { api } from "../../services/apiServices"; // <-- 1. Import the real api

// --- ASYNC THUNKS for Alerts ---
export const fetchAllAlerts = createAsyncThunk(
  "alerts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      // MOCK IMPLEMENTATION
      console.log("Fetching new mock alerts...");
      await new Promise((resolve) => setTimeout(resolve, 750));
      const mockAlerts = generateMockAlerts();
      return mockAlerts;

      //const alerts = await api.getAllAlerts(); // <-- 2. Use the real api call
      //return alerts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAlert = createAsyncThunk(
  "alerts/delete",
  async (alertId, { rejectWithValue }) => {
    try {
      // await api.deleteAlert(alertId); // This would be the real API call

      //await api.deleteAlert(alertId); // <-- 3. Use the real api call
      return alertId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const favoriteAlert = createAsyncThunk(
  "alerts/favorite",
  async (alertId, { rejectWithValue }) => {
    try {
      // await api.favoriteAlert(alertId); // This would be the real API call
      //await api.favoriteAlert(alertId); // <-- 4. Use the real api call
      return alertId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const alertsSlice = createSlice({
  name: "alerts",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  // --- ADD A NEW REDUCER HERE ---
  reducers: {
    /**
     * Adds a single new alert to the beginning of the list.
     * This is for real-time updates.
     */
    addRealtimeAlert: (state, action) => {
      // unshift() adds the new item to the start of the array
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetching alerts
      .addCase(fetchAllAlerts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllAlerts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAllAlerts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Deleting an alert
      .addCase(deleteAlert.fulfilled, (state, action) => {
        const alertIdToRemove = action.payload;
        state.items = state.items.filter(
          (alert) => alert.id !== alertIdToRemove
        );
      })
      // Favoriting an alert
      .addCase(favoriteAlert.fulfilled, (state, action) => {
        const alertIdToFavorite = action.payload;
        const alert = state.items.find((a) => a.id === alertIdToFavorite);
        if (alert) {
          alert.isFavorite = !alert.isFavorite;
        }
      });
  },
});

// --- FIX: ADD THE MISSING EXPORTS HERE ---
export const { addRealtimeAlert } = alertsSlice.actions;
export const selectAllAlerts = (state) => state.alerts.items;
export const selectAlertsStatus = (state) => state.alerts.status; // This was missing
export const selectAlertsError = (state) => state.alerts.error; // Also good to have

export default alertsSlice.reducer;
