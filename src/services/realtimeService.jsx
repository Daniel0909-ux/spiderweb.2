// Import the new actions
import { updateTenGigLink } from "../redux/slices/tenGigLinksSlice";
import { connectionEstablished } from "../redux/slices/realtimeSlice";
import { addRealtimeAlert } from "../redux/slices/alertsSlice";
import { addNotification } from "../redux/slices/uiSlice";
import { faker } from "@faker-js/faker"; // Make sure faker is imported if not already

// --- Helper to generate a single alert ---
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
  alertIntervalId: null, // Separate interval for alerts

  start(dispatch, getState) {
    if (this.linkIntervalId || this.alertIntervalId) {
      this.stop();
    }

    dispatch(connectionEstablished());

    // --- Interval for updating link status (as before) ---
    this.linkIntervalId = setInterval(() => {
      const { items: allLinks } = getState().tenGigLinks;
      if (allLinks && allLinks.length > 0) {
        const randomLink =
          allLinks[Math.floor(Math.random() * allLinks.length)];
        const statuses = ["up", "down", "issue"];
        const currentStatusIndex = statuses.indexOf(randomLink.status);
        const nextStatus = statuses[(currentStatusIndex + 1) % statuses.length];
        dispatch(updateTenGigLink({ id: randomLink.id, status: nextStatus }));
      }
    }, 3500);

    // --- NEW: Interval for generating new alerts ---
    this.alertIntervalId = setInterval(() => {
      console.log("[RealtimeService] Firing new alert...");
      const newAlert = generateSingleMockAlert();

      // 1. Add the alert to the main list (unchanged)
      dispatch(addRealtimeAlert(newAlert));

      // 2. Dispatch the action to ADD the notification to the UI queue
      dispatch(addNotification(newAlert)); // <-- THIS IS THE CHANGED LINE
    }, 12000); // Generate a new alert every 12 seconds
  },

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
