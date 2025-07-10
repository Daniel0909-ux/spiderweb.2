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
  addCoreDevice: async (deviceData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Adding core device...", deviceData);
    return { ...deviceData, id: Date.now() };
  },
  deleteCoreDevice: async (deviceId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Mock API: Deleting core device with ID:", deviceId);
    return { success: true };
  },
};

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
      const response = await mockApi.getCoreDevices();
      // const response = await api.getCoreDevices(); // Use this for the real API
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCoreDevice = createAsyncThunk(
  "devices/addCoreDevice",
  async (deviceData, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.addCoreDevice(deviceData);
      // await api.addCoreDevice(deviceData); // Use this for the real API

      // On success, re-fetch the entire list for data consistency
      dispatch(fetchDevices());
      return deviceData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCoreDevice = createAsyncThunk(
  "devices/deleteCoreDevice",
  async (deviceId, { dispatch, rejectWithValue }) => {
    try {
      await mockApi.deleteCoreDevice(deviceId);
      // await api.deleteDevice(deviceId); // Use this for the real API

      // On success, re-fetch the list to reflect the deletion
      dispatch(fetchDevices());
      return deviceId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice Definition ---
const devicesSlice = createSlice({
  name: "devices",
  initialState: {
    items: [],
    deviceInfo: {}, // Holds detailed info keyed by device ID
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {}, // All actions are now async thunks handled in extraReducers
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
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

// --- Export Reducer ---
export default devicesSlice.reducer;
