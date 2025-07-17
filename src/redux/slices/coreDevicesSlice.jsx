// src/redux/slices/coreDevicesSlice.js

import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { api } from "../../services/apiServices";
import { logout } from "./authSlice";

// --- ENTITY ADAPTER for efficient state management of all core devices ---
const coreDevicesAdapter = createEntityAdapter({
  selectId: (device) => device.id,
});

const initialState = coreDevicesAdapter.getInitialState({
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

// --- ASYNC THUNKS ---

/**
 * CHILD THUNK: Fetches all core devices for a SINGLE given core site ID.
 */
export const fetchCoreDevicesForSite = createAsyncThunk(
  "coreDevices/fetchForSite",
  async (coreSiteId, { rejectWithValue }) => {
    try {
      const devices = await api.getCoreDevicesByCoreSite(coreSiteId);
      // The API response for a device doesn't include its parent site ID.
      // We add it here so we can filter by site later.
      const devicesWithSiteId = (Array.isArray(devices) ? devices : []).map(
        (device) => ({
          ...device,
          core_site_id: coreSiteId, // Add the foreign key
        })
      );
      return devicesWithSiteId;
    } catch (error) {
      return rejectWithValue({ coreSiteId, message: error.message });
    }
  }
);

/**
 * MASTER THUNK: Fetches core devices for ALL provided core site IDs.
 * This is the main thunk called by the app initializer. It collects all data
 * and returns it in a single payload.
 */
export const fetchAllCoreDevices = createAsyncThunk(
  "coreDevices/fetchAll",
  async (coreSiteIds, { dispatch, rejectWithValue }) => {
    if (!Array.isArray(coreSiteIds) || coreSiteIds.length === 0) {
      return []; // Nothing to fetch, return empty array to prevent errors
    }
    try {
      const fetchPromises = coreSiteIds.map((id) =>
        dispatch(fetchCoreDevicesForSite(id))
      );
      const results = await Promise.all(fetchPromises);

      // Filter out rejected promises and flatten the arrays of devices into one.
      const allDevices = results
        .filter((result) => fetchCoreDevicesForSite.fulfilled.match(result))
        .flatMap((result) => result.payload); // The payload is already an array of devices

      // Return one single, combined array of all devices.
      return allDevices;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- CRUD Thunks (for targeted reloads) ---
export const addCoreDevice = createAsyncThunk(
  "coreDevices/addCoreDevice",
  async (deviceData, { dispatch, rejectWithValue }) => {
    // deviceData must include parent core_site_id
    try {
      await api.addCoreDevice(deviceData);
      dispatch(fetchCoreDevicesForSite(deviceData.core_site_id));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCoreDevice = createAsyncThunk(
  "coreDevices/deleteCoreDevice",
  async (payload, { dispatch, rejectWithValue }) => {
    // Payload: { deviceId, coreSiteId }
    const { deviceId, coreSiteId } = payload;
    try {
      await api.deleteCoreDevice(deviceId);
      dispatch(fetchCoreDevicesForSite(coreSiteId));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- THE SLICE DEFINITION ---
const coreDevicesSlice = createSlice({
  name: "coreDevices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // --- Master Thunk Reducers ---
    builder.addCase(fetchAllCoreDevices.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchAllCoreDevices.fulfilled, (state, action) => {
      // `action.payload` is the flat array of all devices returned by the thunk.
      // `setAll` correctly populates BOTH `state.ids` and `state.entities`.
      // This is the key fix for this slice.
      if (action.payload) {
        coreDevicesAdapter.setAll(state, action.payload);
      }
      state.status = "succeeded";
    });
    builder.addCase(fetchAllCoreDevices.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });

    // --- Child Thunk Reducer ---
    // This is still useful for targeted updates (add/delete) and to ensure
    // data is always fresh, even if it's redundant during the initial load.
    builder.addCase(fetchCoreDevicesForSite.fulfilled, (state, action) => {
      coreDevicesAdapter.upsertMany(state, action.payload);
    });

    // --- Logout Reducer ---
    builder.addCase(logout.type, () => {
      return initialState;
    });
  },
});

// --- EXPORT SELECTORS ---
export const {
  selectAll: selectAllCoreDevices,
  selectById: selectCoreDeviceById,
} = coreDevicesAdapter.getSelectors((state) => state.coreDevices);

export const selectCoreDevicesStatus = (state) => state.coreDevices.status;
export const selectCoreDevicesError = (state) => state.coreDevices.error;

// Memoized selector to get all core devices that belong to a list of site IDs
export const selectCoreDevicesBySiteIds = createSelector(
  [selectAllCoreDevices, (state, siteIds) => siteIds],
  (allDevices, siteIds) => {
    const siteIdSet = new Set(siteIds);
    return allDevices.filter((device) => siteIdSet.has(device.core_site_id));
  }
);

export default coreDevicesSlice.reducer;
