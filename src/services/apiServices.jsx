import axios from "axios";
import Cookies from "js-cookie";

// --- Configuration ---
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

//REACT_APP_API_URL=http://your-backend-api.com/api (instead of VITE_API_URL || "http://localhost:8000/api";)

// --- Create a Centralized Axios Instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Axios Interceptor for Authentication ---
apiClient.interceptors.request.use(
  (config) => {
    // The name of the cookie must match where you store it after login
    const token = Cookies.get("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API Helper Function ---
/**
 * A helper function to handle API calls and potential errors.
 * It assumes the backend returns data directly (not wrapped in a "response" key).
 * @param {Promise} request - The axios request promise.
 * @returns {Promise<any>} A promise that resolves to the response data.
 */
const handleApiCall = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    console.error("API call failed:", error.response || error.message);
    // Re-throw the error so the calling component/thunk can handle it (e.g., show a UI message)
    throw error;
  }
};

export const api = {
  // --- AUTHENTICATION ---
  /**
   * Logs in a user and returns the access token.
   * @param {string} username - The user's username.
   * @param {string} password - The user's password.
   * @returns {Promise<string>} The authentication token.
   */
  login: async (username, password) => {
    const response = await apiClient.post("/login", { username, password });
    return response.data.access_token;
  },

  // --- GET Endpoints ---
  getTenGigLines: () => handleApiCall(apiClient.get("/get_ten_gig_lines")),
  getNetTypes: () => handleApiCall(apiClient.get("/get_net_types")),
  getCorePikudim: () => handleApiCall(apiClient.get("/get_core_pikudim")),
  getCoreDevices: () => handleApiCall(apiClient.get("/get_core_devices")),
  getSites: () => handleApiCall(apiClient.get("/get_sites")),
  getDeviceInfo: (deviceId) =>
    handleApiCall(apiClient.get(`/get_device_info/${deviceId}`)),
  getDevicesByCorePikudim: (corePikudimId) =>
    handleApiCall(
      apiClient.get(`/get_devices_by_core_pikudim/${corePikudimId}`)
    ),
  getSiteBandwidth: (siteName) =>
    handleApiCall(apiClient.get(`/get_site_bw/${siteName}`)),
  getInterfacesUp: (siteName) =>
    handleApiCall(apiClient.get(`/get_interfaces_up/${siteName}`)),

  // --- POST (Create/Add) Endpoints ---
  addCorePikudim: (pikudData) =>
    handleApiCall(apiClient.post("/add_core_pikudim", pikudData)),
  addCoreDevice: (deviceData) =>
    handleApiCall(apiClient.post("/add_core_device", deviceData)),
  addNetType: (netTypeData) =>
    handleApiCall(apiClient.post("/add_net_type", netTypeData)),
  /**
   * Triggers a WAN connection check for a specific segment and site.
   * @param {object} networkData - Object with management_segment and sda_site_id.
   * @returns {Promise<any>} A promise that resolves to the connection check result.
   */
  getWanConnection: (networkData) =>
    handleApiCall(apiClient.post("/get_wan_connection", networkData)),

  // --- PUT (Update/Action) Endpoints ---
  /**
   * Triggers a refresh of all interfaces for a specific device.
   * @param {string|number} deviceId - The ID of the device to refresh.
   * @returns {Promise<object>} A promise that resolves to the confirmation/status response.
   */
  refreshInterfacesPerDevice: (deviceId) =>
    handleApiCall(apiClient.put(`/refresh_interfaces_per_device/${deviceId}`)),

  /**
   * Triggers a refresh for a single, specific interface.
   * @param {object} refreshData - The data for the refresh (e.g., { device_id: 1, interface: 'Gig0/1' }).
   * @returns {Promise<object>} A promise that resolves to the confirmation/status response.
   */
  refreshInterface: (refreshData) =>
    handleApiCall(apiClient.put(`/refresh_interface`, refreshData)),

  /**
   * Marks a specific alert as a favorite.
   * @param {string|number} alertId - The ID of the alert to favorite.
   * @returns {Promise<object>} A promise that resolves to the confirmation response.
   */
  favoriteAlert: (alertId) =>
    handleApiCall(apiClient.put(`/favorite_alert/${alertId}`)),

  // --- DELETE Endpoints ---
  deleteCorePikudim: (corePikudimId) =>
    handleApiCall(apiClient.delete(`/delete_core_pikudim/${corePikudimId}`)),
  deleteDevice: (deviceId) =>
    handleApiCall(apiClient.delete(`/delete_device/${deviceId}`)),
  deleteNetType: (netTypeId) =>
    handleApiCall(apiClient.delete(`/delete_net_type/${netTypeId}`)),
  /**
   * Deletes a specific alert by its ID.
   * @param {string|number} alertId - The ID of the alert to delete.
   * @returns {Promise<object>} A promise that resolves to the confirmation response.
   */
  deleteAlert: (alertId) =>
    handleApiCall(apiClient.delete(`/delete_alert/${alertId}`)),

  // --- ALERTS Endpoints ---
  /**
   * Fetches all alerts from the database.
   * @returns {Promise<Array<object>>} A promise that resolves to a list of alert objects.
   */
  getAllAlerts: () => handleApiCall(apiClient.get("/get_all_alerts")),

  /**
   * Fetches the status of all alerts.
   * @returns {Promise<any>} A promise that resolves to the alert status data.
   */
  getAllAlertsStatus: () =>
    handleApiCall(apiClient.get("/get_all_alerts_status")),

  /**
   * Fetches the severity of all alerts.
   * @returns {Promise<any>} A promise that resolves to the alert severity data.
   */
  getAllAlertsSeverity: () =>
    handleApiCall(apiClient.get("/get_all_alerts_severity")),

  /**
   * Fetches the favorite link IDs for the currently authenticated user.
   * @returns {Promise<Array<string>>} A promise that resolves to an array of link IDs.
   */
  getFavoriteLinks: () =>
    handleApiCall(apiClient.get("/users/me/favorites/links")),

  /**
   * Replaces the user's list of favorite links on the server.
   * @param {Array<string>} linkIds - The complete new array of favorite link IDs.
   * @returns {Promise<object>} A promise that resolves to the server's confirmation response.
   */
  updateFavoriteLinks: (linkIds) =>
    handleApiCall(
      apiClient.put("/users/me/favorites/links", { link_ids: linkIds })
    ),
};
