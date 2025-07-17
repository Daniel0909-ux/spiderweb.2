// src/redux/store.js

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import sitesReducer from "./slices/sitesSlice";
import coreDevicesReducer from "./slices/coreDevicesSlice";
import linksReducer from "./slices/linksSlice";
import coreSitesReducer from "./slices/coreSitesSlice";
import favoritesReducer from "./slices/favoritesSlice";
import networksReducer from "./slices/networksSlice";
import authReducer, { logout } from "./slices/authSlice";
import realtimeReducer from "./slices/realtimeSlice";
import alertsReducer from "./slices/alertsSlice";
import uiReducer from "./slices/uiSlice";
import realtimeMiddleware from "./middleware/realtimeMiddleware";

// 1. Combine all your slice reducers into a single "app" reducer
const appReducer = combineReducers({
  sites: sitesReducer,
  coreDevices: coreDevicesReducer,
  links: linksReducer,
  coreSites: coreSitesReducer,
  favorites: favoritesReducer,
  networks: networksReducer,
  auth: authReducer,
  realtime: realtimeReducer,
  alerts: alertsReducer,
  ui: uiReducer,
});

// Create a "root" reducer that delegates to the appReducer
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    return appReducer(undefined, action);
  }

  // For all other actions, just pass them through to the appReducer
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(realtimeMiddleware),
});
