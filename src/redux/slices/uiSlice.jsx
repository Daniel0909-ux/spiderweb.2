import { createSlice } from "@reduxjs/toolkit";

const MAX_NOTIFICATIONS = 3;

const initialState = {
  // The state now holds an array of notification objects
  notifications: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * Adds a new notification to the list.
     * Enforces a maximum number of visible notifications.
     * The payload should be an alert object.
     */
    addNotification: (state, action) => {
      // Add the new notification to the beginning of the array
      state.notifications.unshift(action.payload);

      // If we now have more than the max allowed, remove the oldest one
      if (state.notifications.length > MAX_NOTIFICATIONS) {
        state.notifications.pop();
      }
    },
    /**
     * Removes a specific notification from the list by its ID.
     * The payload should be the alert ID to dismiss.
     */
    dismissNotification: (state, action) => {
      const idToDismiss = action.payload;
      state.notifications = state.notifications.filter(
        (n) => n.id !== idToDismiss
      );
    },
  },
});

export const { addNotification, dismissNotification } = uiSlice.actions;

// Selector to get the current list of notifications
export const selectCurrentNotifications = (state) => state.ui.notifications;

export default uiSlice.reducer;
