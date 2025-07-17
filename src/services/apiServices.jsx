import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
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

const handleApiCall = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    console.error("API call failed:", error.response || error.message);
    throw error;
  }
};

export const api = {
  login: async (username, password) => {
    const response = await apiClient.post("/login", { username, password });
    const token = response.data.token;

    if (token) {
      Cookies.set("authToken", token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });
    }
    return token;
  },

  logout: () => {
    Cookies.remove("authToken");
  },

  // --- NEW GET Endpoints ---

  /**
   * Fetches all networks. Replaces get_net_types.
   * @returns {Promise<Array<{id: number|string, name: string}>>} A list of all networks.
   */
  getNetworks: () => handleApiCall(apiClient.get("/networks")),

  /**
   * Fetches all core sites for a given network ID. Replaces get_core_pikudim.
   * @param {string|number} networkId - The ID of the network.
   * @returns {Promise<Array<{id: number|string, name: string}>>} A list of core sites for that network.
   */
  getCoreSitesByNetwork: (networkId) =>
    handleApiCall(apiClient.get(`/network/${networkId}/coresites`)),

  /**
   * Fetches all core devices for a given core site ID. Replaces get_core_devices.
   * @param {string|number} coreSiteId - The ID of the core site.
   * @returns {Promise<Array<{id: number|string, name: string, ip: string}>>} A list of core devices for that site.
   */
  getCoreDevicesByCoreSite: (coreSiteId) =>
    handleApiCall(apiClient.get(`/coresite/${coreSiteId}/coredevices`)),
  /**
   * Fetches links between a core device and other core devices.
   * @param {string|number} coreDeviceId - The ID of the core device.
   * @returns {Promise<Array<any>>} A list of core-to-core links.
   */
  getCoreToCoreLinks: (coreDeviceId) =>
    handleApiCall(apiClient.get(`/coreDevice/${coreDeviceId}/links`)),

  /**
   * Fetches links between a core device and its connected end-sites.
   * @param {string|number} coreDeviceId - The ID of the core device.
   * @returns {Promise<Array<any>>} A list of core-to-site links.
   */
  getCoreToSiteLinks: (coreDeviceId) =>
    handleApiCall(apiClient.get(`/device/${coreDeviceId}/end-sites`)),

  // Note: We are not using getEndSiteLinks for the initial load,
  // but it's good to have it defined for future features.
  /**
   * Fetches links for a specific end-site.
   * @param {string|number} endSiteId - The ID of the end-site.
   * @returns {Promise<Array<any>>} A list of links for that site.
   */
  getEndSiteLinks: (endSiteId) =>
    handleApiCall(apiClient.get(`/endsites/${endSiteId}/links`)),
  /**
   * Fetches a list of all end-sites (basic info).
   * @returns {Promise<Array<any>>} A list of end-sites.
   */
  getEndSites: () => handleApiCall(apiClient.get("/endsites")),

  /**
   * Fetches detailed metadata for a single end-site.
   * @param {string|number} endSiteId - The ID of the end-site.
   * @returns {Promise<object>} Detailed data for one end-site.
   */
  getEndSiteById: (endSiteId) =>
    handleApiCall(apiClient.get(`/endsites/${endSiteId}`)),
};
