// src/services/realtimeService.js

// --- 1. UPDATED IMPORTS ---
// Import the new action `updateLinkStatus` and the new selector `selectAllLinks` from the correct slice.
import { updateLinkStatus, selectAllLinks } from "../redux/slices/linksSlice";
import { connectionEstablished } from "../redux/slices/realtimeSlice";
import { addRealtimeAlert } from "../redux/slices/alertsSlice";
import { addNotification } from "../redux/slices/uiSlice";
import { faker } from "@faker-js/faker";

// --- Helper to generate a single alert (Unchanged) ---
const generateSingleMockAlert = () => {
  const types = ["error", "warning", "info"];
  const messages = [
    "High packet drop on Core-Router-A",
    "SSL Certificate expires in 7 days",
    "Login from new IP address",
    "Backup for DB-01 completed",
    "Latency threshold exceeded on link NYC-LDN",
  ];
  return {
    id: `alert-${Date.now()}-${faker.string.uuid()}`,
    type: faker.helpers.arrayElement(types),
    message: faker.helpers.arrayElement(messages),
    timestamp: new Date().toISOString(),
    networkLine: `Line-Z-${faker.number.int({ min: 1, max: 99 })}`,
    details: "This is a real-time generated alert.",
    source: "Realtime-Monitor",
    severityScore: faker.number.int({ min: 4, max: 10 }),
    isFavorite: false,
  };
};

const realtimeService = {
  linkIntervalId: null,
  alertIntervalId: null,

  start(dispatch, getState) {
    if (this.linkIntervalId || this.alertIntervalId) {
      this.stop();
    }

    dispatch(connectionEstablished());

    // --- Interval for updating link status ---
    this.linkIntervalId = setInterval(() => {
      // --- 2. UPDATED: Get links from the new state structure ---
      // The `links` slice uses an entity adapter, so we use the `selectAllLinks` selector.
      const state = getState();
      const allLinks = selectAllLinks(state);

      if (allLinks && allLinks.length > 0) {
        // This logic to pick a random link remains the same
        const randomLink =
          allLinks[Math.floor(Math.random() * allLinks.length)];
        const statuses = ["up", "down", "issue"];
        const currentStatusIndex = statuses.indexOf(randomLink.status);
        const nextStatus = statuses[(currentStatusIndex + 1) % statuses.length];

        // --- 3. UPDATED: Dispatch the new action name ---
        dispatch(updateLinkStatus({ id: randomLink.id, status: nextStatus }));
      }
    }, 3500);

    // --- Interval for generating new alerts (Unchanged) ---
    this.alertIntervalId = setInterval(() => {
      console.log("[RealtimeService] Firing new alert...");
      const newAlert = generateSingleMockAlert();
      dispatch(addRealtimeAlert(newAlert));
      dispatch(addNotification(newAlert));
    }, 12000);
  },

  // The stop method is correct and does not need changes.
  stop() {
    if (this.linkIntervalId) {
      clearInterval(this.linkIntervalId);
      this.linkIntervalId = null;
    }
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
    }
    console.log("[RealtimeService] Stopped.");
  },
};

export default realtimeService;
