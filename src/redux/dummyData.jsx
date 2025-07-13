import { faker } from "@faker-js/faker";

// --- NEW: Add the mock alert generator here ---
export const generateMockAlerts = () => {
  // ... (no changes in this function)
  const alerts = [];
  const now = new Date();
  const types = ["error", "warning", "info"];
  const messages = [
    "Network line Alpha-01 experiencing high latency.",
    "Router Gamma-03 offline.",
    "Firewall policy update successful on Delta-Cluster.",
    "Network segment Beta-West approaching capacity.",
    "Unusual traffic pattern detected from IP 192.168.1.100.",
    "VPN connection dropped for user 'johndoe'.",
    "Server Epsilon-db CPU utilization at 95%.",
    "New device connected: IOT-Sensor-7B on VLAN 10.",
    "Security scan completed: 0 vulnerabilities found.",
    "Backup job 'DailySystemBackup' finished successfully.",
  ];

  const alertCount = faker.number.int({ min: 1950, max: 2050 });

  for (let i = 0; i < alertCount; i++) {
    const randomMinutesAgo = Math.floor(Math.random() * 7 * 24 * 60 * 1.5);
    alerts.push({
      id: `alert-${i + 1}-${faker.string.uuid()}`,
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(now.getTime() - randomMinutesAgo * 60000),
      networkLine: `Line-${String.fromCharCode(65 + Math.floor(i / 10))}-${
        (i % 10) + 1
      }`,
      details: `This is a more detailed description for alert ${
        i + 1
      }. It might include diagnostic information, affected systems, or suggested actions.`,
      source: `SourceSystem-${Math.floor(Math.random() * 5) + 1}`,
      severityScore: Math.floor(Math.random() * 10) + 1,
    });
  }
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
};

// --- 1. ADD DUMMY USERS ARRAY ---
const dummyUsers = [
  { username: "admin", password: "password123", role: "admin" },
  { username: "userg", password: "password123", role: "user" },
  { username: "viewer", password: "password", role: "viewer" },
];

// --- Helper to create a number of items ---
const createItems = (creator, count, ...args) => {
  return Array.from({ length: count }, () => creator(...args));
};

// --- Individual Data Generators ---

const createCorePikudim = (typeId) => ({
  id: faker.number.int({ min: 1000, max: 9999 }),
  core_site_name: `Pikud-${faker.location.city()}`,
  type_id: typeId,
  timestamp: faker.date.recent().toISOString(),
});

const createCoreDevice = (pikud, endingNumber) => ({
  id: faker.number.int({ min: 100, max: 999 }),
  hostname: `rtr-${faker.string.alphanumeric(4)}-${endingNumber}`,
  ip_address: faker.internet.ip(),
  network_type_id: pikud.type_id,
  core_pikudim_site_id: pikud.id,
  timestamp: faker.date.recent().toISOString(),
});

const createSite = (siteNames, device, interfaceData) => ({
  id: faker.number.int({ min: 10000, max: 99999 }),
  interface_id: interfaceData.name || "N/A",
  device_id: device.id,
  site_name_hebrew: siteNames.hebrew,
  site_name_english: siteNames.english,
  timestamp: faker.date.recent().toISOString(),
  physicalStatus: interfaceData.physical_status || "N/A",
  protocolStatus: interfaceData.protocol_status || "N/A",
  MPLS: interfaceData.mpls || "N/A",
  OSPF: interfaceData.ospf || "N/A",
  Bandwidth: interfaceData.bandwidth ?? "N/A",
  Description: interfaceData.description || "N/A",
  MediaType: interfaceData.media_type || "N/A",
  CDP: interfaceData.cdp || "N/A",
  TX: interfaceData.tx ?? "N/A",
  RX: interfaceData.rx ?? "N/A",
});

const createInterfaceInfo = (deviceId) => ({
  id: faker.number.int({ min: 5000, max: 9999 }),
  name: faker.helpers.arrayElement([
    "GigabitEthernet0/1",
    "TenGigabitEthernet1/0/1",
    "FastEthernet0/24",
  ]),
  core_pikudim_device_id: deviceId,
  media_type: "Fiber",
  description: faker.lorem.sentence(),
  physical_status: faker.helpers.arrayElement(["Up", "Down"]),
  protocol_status: faker.helpers.arrayElement(["Up", "Down"]),
  cdp: `neighbor-switch-${faker.string.alphanumeric(3)}`,
  bandwidth: 10000,
  mtu: 9000,
  ospf: "Enabled",
  mpls: "Enabled",
  crc: faker.number.int({ min: 0, max: 10 }),
  input_data: faker.number.int({ min: 100, max: 900 }),
  output_data: faker.number.int({ min: 100, max: 800 }),
  tx: -faker.number.float({ min: 1, max: 5, precision: 0.1 }),
  rx: -faker.number.float({ min: 1, max: 5, precision: 0.1 }),
  timestamp: faker.date.recent().toISOString(),
});

// --- MODIFIED & CORRECTED ---
// This function now creates and returns an ARRAY of 1 to 3 "parallel" links
// between the same source and target devices.
const createTenGigLink = (sourceDevice, targetDevice, sourceInterface) => {
  const links = [];
  // Decide to create 1, 2, or 3 links for this source/target pair
  const linkCount = faker.number.int({ min: 1, max: 3 });

  // Define the properties that will be THE SAME for all parallel links
  const commonProperties = {
    source: sourceDevice.hostname,
    target: targetDevice.hostname,
    network_type_id: sourceDevice.network_type_id,
    ip: faker.internet.ip(),
    physicalStatus: sourceInterface.physical_status || "N/A",
    protocolStatus: sourceInterface.protocol_status || "N/A",
    MPLS: sourceInterface.mpls || "N/A",
    OSPF: sourceInterface.ospf || "N/A",
    Bandwidth: sourceInterface.bandwidth ?? "N/A",
    Description: sourceInterface.description || "N/A",
    MediaType: sourceInterface.media_type || "N/A",
    CDP: sourceInterface.cdp || "N/A",
    TX: sourceInterface.tx ?? "N/A",
    RX: sourceInterface.rx ?? "N/A",
  };

  // Create the individual links
  for (let i = 0; i < linkCount; i++) {
    links.push({
      ...commonProperties,
      // Define properties that are UNIQUE for each parallel link
      id: `link-10g-${faker.string.alphanumeric(8)}`,
      status: faker.helpers.arrayElement(["up", "down", "issue"]),
    });
  }

  return links;
};

// --- Main Export Function ---

export const generateAllDummyData = () => {
  // --- 1. Generate Pikudim (Core Sites) and Devices ---
  const lChartPikudim = createItems(createCorePikudim, 6, 1);
  const pChartPikudim = createItems(createCorePikudim, 5, 2);
  const corePikudim = [...lChartPikudim, ...pChartPikudim];

  const allowedEndings = [1, 2, 4, 5, 7, 8];
  const coreDevices = corePikudim.flatMap((pikud) => {
    const deviceCount = faker.number.int({ min: 2, max: 6 });
    const devicesForThisPikud = [];
    for (let i = 0; i < deviceCount && i < allowedEndings.length; i++) {
      const endingNumber = allowedEndings[i];
      devicesForThisPikud.push(createCoreDevice(pikud, endingNumber));
    }
    return devicesForThisPikud;
  });

  // --- Generate deviceInfo early, as it's needed for both links and sites ---
  const deviceInfo = coreDevices.reduce((acc, device) => {
    acc[device.id] = createItems(
      createInterfaceInfo,
      faker.number.int({ min: 3, max: 8 }),
      device.id
    );
    return acc;
  }, {});

  // --- 2. Group Devices by their Core Site ID ---
  const devicesBySite = new Map();
  for (const device of coreDevices) {
    if (!devicesBySite.has(device.core_pikudim_site_id)) {
      devicesBySite.set(device.core_pikudim_site_id, []);
    }
    devicesBySite.get(device.core_pikudim_site_id).push(device);
  }

  // --- 3. Generate Structured "Same Site" Links ---
  // --- MODIFIED & CORRECTED ---
  const sameSiteLinks = [];
  const sameSitePairs = [
    [1, 2],
    [1, 4],
    [1, 5],
    [2, 4],
    [2, 5],
    [4, 5],
    [4, 7],
    [4, 8],
    [5, 7],
    [5, 8],
    [7, 8],
  ];

  for (const siteDevices of devicesBySite.values()) {
    const deviceMapByEnding = new Map();
    for (const device of siteDevices) {
      const ending = parseInt(device.hostname.split("-").pop(), 10);
      deviceMapByEnding.set(ending, device);
    }
    for (const [end1, end2] of sameSitePairs) {
      if (deviceMapByEnding.has(end1) && deviceMapByEnding.has(end2)) {
        const sourceDevice = deviceMapByEnding.get(end1);
        const targetDevice = deviceMapByEnding.get(end2);
        const sourceInterfaces = deviceInfo[sourceDevice.id];

        if (sourceInterfaces?.length > 0) {
          const sourceInterface = faker.helpers.arrayElement(sourceInterfaces);
          // We use the spread operator (...) because createTenGigLink now returns an array of links.
          sameSiteLinks.push(
            ...createTenGigLink(sourceDevice, targetDevice, sourceInterface)
          );
        }
      }
    }
  }

  // --- 4. Generate Random "Different Site" Links ---
  // --- MODIFIED & CORRECTED ---
  const differentSiteLinks = [];
  const lChartDevices = coreDevices.filter((d) => d.network_type_id === 1);
  const pChartDevices = coreDevices.filter((d) => d.network_type_id === 2);

  const createRandomInterSiteLinks = (deviceList, count) => {
    const createdPairs = new Set();
    for (let i = 0; i < count; i++) {
      if (deviceList.length < 2) break;
      let sourceDevice, targetDevice, pairKey;
      do {
        sourceDevice = faker.helpers.arrayElement(deviceList);
        targetDevice = faker.helpers.arrayElement(deviceList);
        const sortedIds = [sourceDevice.id, targetDevice.id].sort();
        pairKey = `${sortedIds[0]}-${sortedIds[1]}`;
      } while (
        sourceDevice.core_pikudim_site_id ===
          targetDevice.core_pikudim_site_id ||
        createdPairs.has(pairKey)
      );

      const sourceInterfaces = deviceInfo[sourceDevice.id];

      if (sourceInterfaces?.length > 0) {
        const sourceInterface = faker.helpers.arrayElement(sourceInterfaces);
        // We use the spread operator (...) here as well to flatten the returned array of links.
        differentSiteLinks.push(
          ...createTenGigLink(sourceDevice, targetDevice, sourceInterface)
        );
        createdPairs.add(pairKey);
      }
    }
  };

  createRandomInterSiteLinks(lChartDevices, 50);
  createRandomInterSiteLinks(pChartDevices, 40);

  const tenGigLinks = [...sameSiteLinks, ...differentSiteLinks];

  // --- 5. Generate Paired Sites (Dual-Homed) ---
  const sites = [];
  const numberOfLogicalSites = 250;

  if (coreDevices.length >= 2) {
    for (let i = 0; i < numberOfLogicalSites; i++) {
      const city = faker.location.city();
      const siteNames = { hebrew: `אתר ${city}`, english: `Site ${city}` };

      let device1, device2;
      do {
        device1 = faker.helpers.arrayElement(coreDevices);
        device2 = faker.helpers.arrayElement(coreDevices);
      } while (device1.id === device2.id);

      const interfaces1 = deviceInfo[device1.id];
      if (interfaces1?.length > 0) {
        const interface1 = faker.helpers.arrayElement(interfaces1);
        sites.push(createSite(siteNames, device1, interface1));
      }

      const interfaces2 = deviceInfo[device2.id];
      if (interfaces2?.length > 0) {
        const interface2 = faker.helpers.arrayElement(interfaces2);
        sites.push(createSite(siteNames, device2, interface2));
      }
    }
  }

  // --- 6. Finalize Remaining Data ---
  const netTypes = [
    { id: 1, name: "L-Chart Network" },
    { id: 2, name: "P-Chart Network" },
  ];

  return {
    corePikudim,
    coreDevices,
    sites,
    deviceInfo,
    netTypes,
    tenGigLinks,
    dummyUsers,
  };
};

// ... (at the end of your existing dummyData.js file)

/**
 * Generates detailed time-series data for a single link over a specified period.
 * @param {string} linkId - The ID of the link to generate data for.
 * @param {number} daysAgo - How many days of history to generate.
 * @returns {object} An object containing different time-series datasets.
 */
export const generateLinkForensicsData = (linkId, daysAgo = 7) => {
  const now = new Date();
  const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const dataPoints = [];
  const events = {
    physical: [],
    protocol: [],
    cdp: [],
  };

  let currentTime = new Date(startTime.getTime());
  let cdpNeighbor = {
    device: "switch-abc-01",
    port: "Gig0/24",
    platform: "Catalyst 9300",
  };

  // Create base data points at 5-minute intervals
  while (currentTime <= now) {
    const timestamp = currentTime.getTime();

    // Simulate bandwidth (with daily and hourly seasonality)
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    const isPeakTime = hour >= 9 && hour <= 17 && day > 0 && day < 6;
    const baseTx = isPeakTime
      ? faker.number.int({ min: 4000, max: 8000 })
      : faker.number.int({ min: 500, max: 2000 });
    const baseRx = isPeakTime
      ? faker.number.int({ min: 3000, max: 7000 })
      : faker.number.int({ min: 400, max: 1500 });

    dataPoints.push({
      timestamp,
      tx: baseTx + faker.number.int({ min: -200, max: 200 }),
      rx: baseRx + faker.number.int({ min: -200, max: 200 }),
      crcErrors: faker.helpers.weightedArrayElement([
        { weight: 95, value: 0 },
        { weight: 5, value: faker.number.int({ min: 1, max: 20 }) },
      ]),
      inputDrops: faker.helpers.weightedArrayElement([
        { weight: 98, value: 0 },
        { weight: 2, value: faker.number.int({ min: 1, max: 5 }) },
      ]),
      outputDrops: faker.helpers.weightedArrayElement([
        { weight: 99, value: 0 },
        { weight: 1, value: faker.number.int({ min: 1, max: 3 }) },
      ]),
    });
    currentTime.setMinutes(currentTime.getMinutes() + 5);
  }

  // Sprinkle in some interesting events
  const totalIntervals = dataPoints.length;

  // A physical down event
  if (totalIntervals > 100) {
    const downStartIndex = faker.number.int({
      min: 50,
      max: totalIntervals - 50,
    });
    const downDuration = faker.number.int({ min: 3, max: 10 }); // in 5-min intervals
    events.physical.push({
      type: "down",
      start: dataPoints[downStartIndex].timestamp,
      end: dataPoints[downStartIndex + downDuration].timestamp,
    });
  }

  // A protocol flap event
  if (totalIntervals > 200) {
    const flapIndex = faker.number.int({ min: 100, max: totalIntervals - 100 });
    events.protocol.push({
      type: "flap",
      state: "Down",
      start: dataPoints[flapIndex].timestamp,
      end: dataPoints[flapIndex + 2].timestamp,
    });
    events.protocol.push({
      type: "ospf_state_change",
      state: "2-Way",
      timestamp: dataPoints[flapIndex - 1].timestamp,
    });
  }

  // A CDP neighbor change
  if (totalIntervals > 300) {
    const cdpChangeIndex = faker.number.int({
      min: 150,
      max: totalIntervals - 150,
    });
    const oldNeighbor = { ...cdpNeighbor };
    cdpNeighbor = {
      device: "firewall-xyz-02",
      port: "Eth1/1",
      platform: "Palo Alto 5220",
    };
    events.cdp.push({
      type: "change",
      timestamp: dataPoints[cdpChangeIndex].timestamp,
      previous: oldNeighbor,
      new: cdpNeighbor,
    });
  }

  return {
    linkId,
    bandwidthData: dataPoints,
    eventData: events,
    maxBandwidth: 10000, // Mbps
    currentStatus: { physical: "Up", protocol: "Up" },
  };
};
