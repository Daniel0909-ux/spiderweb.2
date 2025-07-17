// src/redux/slices/linksSlice.js

import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { logout } from "./authSlice";

// --- ENTITY ADAPTER for efficient state management of all links ---
const linksAdapter = createEntityAdapter();

const initialState = linksAdapter.getInitialState({
  status: "idle",
  error: null,
});

// --- ASYNC THUNKS ---

/**
 * Fetches ALL links (both core-to-core and core-to-site) for a SINGLE core device.
 */
export const fetchLinksForCoreDevice = createAsyncThunk(
  "links/fetchForDevice",
  async (coreDeviceId, { rejectWithValue }) => {
    try {
      // Fetch both types of links concurrently
      const [coreLinks, siteLinks] = await Promise.all([
        api.getCoreToCoreLinks(coreDeviceId),
        api.getCoreToSiteLinks(coreDeviceId),
      ]);

      // Enrich the data with a type property for easier filtering later
      const enrichedCoreLinks = (coreLinks || []).map((link) => ({
        ...link,
        type: "core-to-core",
      }));
      const enrichedSiteLinks = (siteLinks || []).map((link) => ({
        ...link,
        type: "core-to-site",
      }));

      return [...enrichedCoreLinks, ...enrichedSiteLinks];
    } catch (error) {
      return rejectWithValue({ coreDeviceId, message: error.message });
    }
  }
);

/**
 * A "master" thunk to fetch all links for ALL provided core device IDs.
 */
export const fetchAllLinks = createAsyncThunk(
  "links/fetchAll",
  async (coreDeviceIds, { dispatch }) => {
    if (!Array.isArray(coreDeviceIds) || coreDeviceIds.length === 0) return;
    const fetchPromises = coreDeviceIds.map((id) =>
      dispatch(fetchLinksForCoreDevice(id))
    );
    await Promise.all(fetchPromises);
  }
);

// --- THE SLICE DEFINITION ---
const linksSlice = createSlice({
  name: "links",
  initialState,
  reducers: {
    // Reducer for real-time status updates, adapted for the entity adapter
    updateLinkStatus: (state, action) => {
      const { id, status } = action.payload;
      linksAdapter.updateOne(state, {
        id: id,
        changes: { status: status },
      });
    },
  },
  extraReducers: (builder) => {
    // --- THIS IS THE FIX ---
    builder.addCase(fetchAllLinks.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchAllLinks.fulfilled, (state) => {
      state.status = "succeeded";
    });
    builder.addCase(fetchAllLinks.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(fetchLinksForCoreDevice.fulfilled, (state, action) => {
      linksAdapter.upsertMany(state, action.payload);
    });
    builder.addCase(logout.type, () => {
      return initialState;
    });
  },
});

export const { updateLinkStatus } = linksSlice.actions;

// --- EXPORT SELECTORS ---
export const { selectAll: selectAllLinks, selectById: selectLinkById } =
  linksAdapter.getSelectors((state) => state.links);

export const selectLinksStatus = (state) => state.links.status;
export const selectLinksError = (state) => state.links.error;

// New, powerful selector to get links belonging to a specific network (typeId)
export const selectLinksByNetworkId = createSelector(
  [
    selectAllLinks,
    (state) => state.coreDevices.entities, // Get all devices by ID
    (state) => state.coreSites.entities, // Get all core sites by ID
    (state, networkId) => networkId,
  ],
  (allLinks, coreDevices, coreSites, networkId) => {
    if (
      !networkId ||
      !Object.keys(coreDevices).length ||
      !Object.keys(coreSites).length
    ) {
      return [];
    }

    // Create a set of all device IDs that belong to the target network
    const deviceIdsInNetwork = new Set();
    for (const device of Object.values(coreDevices)) {
      // The network ID is on the core site, not the device itself
      const site = coreSites[device.core_site_id];
      // The network ID on the site object might be named differently, e.g. `network_id`
      // We'll assume `site.network_id` for now. Adjust if your API returns a different name.
      if (site && site.network_id === networkId) {
        deviceIdsInNetwork.add(device.id);
      }
    }

    // Filter all links to find those where the source device is in our set
    // This assumes `link.sourceDeviceId` exists on core-to-core links.
    // You may need to adjust this based on your actual link data structure.
    return allLinks.filter((link) => {
      // A link belongs to the network if either its source or target device is in the network.
      // This assumes your link object has `sourceDeviceId` and `targetDeviceId`.
      return (
        deviceIdsInNetwork.has(link.sourceDeviceId) ||
        deviceIdsInNetwork.has(link.targetDeviceId)
      );
    });
  }
);

export default linksSlice.reducer;
