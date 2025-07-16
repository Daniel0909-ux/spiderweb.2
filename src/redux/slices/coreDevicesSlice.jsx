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
 * Fetches all core devices for a SINGLE given core site ID.
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
 * A "master" thunk to fetch core devices for ALL provided core site IDs.
 */
export const fetchAllCoreDevices = createAsyncThunk(
  "coreDevices/fetchAll",
  async (coreSiteIds, { dispatch, rejectWithValue }) => {
    if (!Array.isArray(coreSiteIds) || coreSiteIds.length === 0) {
      return; // Nothing to fetch
    }
    try {
      const fetchPromises = coreSiteIds.map((id) =>
        dispatch(fetchCoreDevicesForSite(id))
      );
      await Promise.all(fetchPromises);
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
    builder
      // Reducer for the "master" fetch thunk
      .addCase(fetchAllCoreDevices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAllCoreDevices.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchAllCoreDevices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Reducer for the INDIVIDUAL site fetch thunk
      .addCase(fetchCoreDevicesForSite.fulfilled, (state, action) => {
        // action.payload is the array of devices, already with the core_site_id
        coreDevicesAdapter.upsertMany(state, action.payload);
      })
      // --- Reducer for Logout ---
      .addCase(logout.type, () => {
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
