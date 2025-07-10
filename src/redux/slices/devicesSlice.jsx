import {
  createSlice,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { initialData } from "../initialData";

// import { api } from "../../services/apiServices"; // To be used for the real API

// --- MOCK API: Simulates the backend API calls for devices ---
const mockApi = {
  getCoreDevices: async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    // The mock API returns an object containing both the devices array and deviceInfo object
    return {
      devices: initialData.coreDevices,
      deviceInfo: initialData.deviceInfo,
    };
  },
/**
 * Normalizer Function (The "Bouncer")
 * Safely extracts the devices array from the raw API response.
 * @param {any} apiResponse - The raw data from action.payload.
 * @returns {Array} A safe array of device objects.
 */
const normalizeDevicesApiResponse = (apiResponse) => {
  if (apiResponse && Array.isArray(apiResponse.devices)) {
    return apiResponse.devices;
  }
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }
  console.warn(
    "Could not normalize Devices API response. Data format is unexpected:",
    apiResponse
  );
  return [];
};

// --- ASYNC THUNKS ---

export const fetchDevices = createAsyncThunk(
  "devices/fetchDevices",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[Thunk] Starting fetchDevices (single API call)...");
      const response = await mockApi.getCoreDevices();

      // --- ONLY ONE API CALL IS NEEDED ---
      //const response = await api.getCoreDevices();
      // This assumes api.getCoreDevices() returns an object like:
      // { devices: [ ... ], deviceInfo: { ... } }

      console.log("[Thunk] Successfully fetched devices data:", response);

      // The response is already in the correct format, so just return it.
      return response;
    } catch (error) {
      console.error("[Thunk] ERROR in fetchDevices:", error.response || error);
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice Definition ---
const devicesSlice = createSlice({
  name: "devices",
  initialState: {
    items: [], // Start with an empty array for the device list
    deviceInfo: {}, // Start with an empty object for device info
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  // Reducers for synchronous, direct state mutations
  reducers: {
    addCoreDevice: (state, action) => {
      state.items.push(action.payload);
    },
    deleteCoreDevice: (state, action) => {
      const deviceIdToDelete = action.payload;
      state.items = state.items.filter((item) => item.id !== deviceIdToDelete);
    },
  },
  // extraReducers handle the lifecycle of the async thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        console.log(
          "[Redux] fetchDevices fulfilled. state.Payload:",
          state.payload
        );
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        console.log(
          "[Redux] fetchDevices fulfilled. action.Payload:",
          action.payload
        );
        state.status = "succeeded";
        // Use the normalizer for the devices array
        state.items = normalizeDevicesApiResponse(action.payload);
        // Safely set the deviceInfo, falling back to an empty object
        state.deviceInfo = action.payload?.deviceInfo || {};
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- Export Actions ---
export const { addCoreDevice, deleteCoreDevice } = devicesSlice.actions;

// --- Export Selectors ---

export const selectAllDevices = (state) => state.devices.items;
export const selectDeviceInfo = (state) => state.devices.deviceInfo;
export const selectDevicesStatus = (state) => state.devices.status;
export const selectDevicesError = (state) => state.devices.error;

// --- MEMOIZED SELECTOR for filtering devices by type ID ---
const selectDeviceItems = (state) => state.devices.items;
const selectTypeIdFromDevice = (state, typeId) => typeId;

export const selectDevicesByTypeId = createSelector(
  [selectDeviceItems, selectTypeIdFromDevice],
  (devices, typeId) => {
    if (!typeId) return [];
    // Ensure `devices` is an array before filtering
    return Array.isArray(devices)
      ? devices.filter((d) => d.network_type_id === typeId)
      : [];
  }
);

// --- MEMOIZED SELECTOR for the loading/error status ---
// This selector solves the "returned a different result" warning.
// It combines `status` and `error` into a single object, but only creates a
// new object if `status` or `error` themselves have actually changed.

// 1. Input selectors: These grab the raw data without creating new references.
const selectStatus = (state) => state.devices.status;
const selectError = (state) => state.devices.error;

// 2. Memoized Selector: This is the one to use in your components.
export const selectCoreDataStatus = createSelector(
  [selectStatus, selectError], // An array of the input selectors
  (status, error) => ({
    // The "result" function that creates the object
    status,
    error,
  })
);

// --- Export Reducer ---
export default devicesSlice.reducer;
