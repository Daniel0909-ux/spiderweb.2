// src/components/auth/AppInitializer.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  fetchInitialData,
  selectAuthStatus,
  selectAuthError,
} from "../../redux/slices/authSlice";
import { startConnecting } from "../../redux/slices/realtimeSlice";
import { fetchAllAlerts } from "../../redux/slices/alertsSlice";
import { Loader2, AlertTriangle } from "lucide-react";

// --- CORRECTED: Import all the necessary status selectors directly ---
import { selectCoreSitesStatus } from "../../redux/slices/coreSitesSlice";
import { selectCoreDevicesStatus } from "../../redux/slices/coreDevicesSlice";
import { selectLinksStatus } from "../../redux/slices/linksSlice";
import { selectSitesStatus } from "../../redux/slices/sitesSlice";

// This selector now directly uses the imported selectors. This is the correct pattern.
const selectCoreDataStatus = createSelector(
  [
    selectCoreSitesStatus,
    selectCoreDevicesStatus, // <<< The imported selector is now used here.
    selectLinksStatus,
    selectSitesStatus,
  ],
  (coreSites, coreDevices, links, sites) => ({
    coreSites,
    coreDevices,
    links,
    sites,
  })
);

export function AppInitializer({ children }) {
  const dispatch = useDispatch();

  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const dataStatus = useSelector(selectCoreDataStatus);

  const isAuthIdle = authStatus === "idle";
  const isAuthLoading = authStatus === "loading";
  const isAuthFailed = authStatus === "failed";

  const isInitialDataLoadFinished = Object.values(dataStatus).every(
    (s) => s === "succeeded" || s === "failed"
  );
  const hasSomeDataSucceeded = Object.values(dataStatus).some(
    (s) => s === "succeeded"
  );

  useEffect(() => {
    if (isAuthIdle) {
      dispatch(fetchInitialData());
    }
  }, [isAuthIdle, dispatch]);

  useEffect(() => {
    let intervalId;
    if (hasSomeDataSucceeded) {
      dispatch(startConnecting());
      intervalId = setInterval(() => {
        dispatch(fetchAllAlerts());
      }, 30000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasSomeDataSucceeded, dispatch]);

  const handleRetry = () => {
    dispatch(fetchInitialData());
  };

  if (isAuthLoading || !isInitialDataLoadFinished) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4 text-center p-4">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-4">
            Initializing Spiderweb
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fetching network topology and status...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthFailed) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4 text-center p-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {authError ||
              "Could not validate your session. Please try logging in again."}
          </p>
          <button
            onClick={handleRetry}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return children;
}
