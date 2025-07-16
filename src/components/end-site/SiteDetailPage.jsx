// src/components/end-site/SiteDetailPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import LinkDetailRow from "./LineDetailExtend";
import StatusBulb from "../shared/StatusBulb";
import { selectAllCoreDevices } from "../../redux/slices/coreDevicesSlice";
// Make sure you have a way to import your api service.
// This might need to be created or adjusted based on your project structure.
// For now, we'll assume a placeholder api object.
const api = {
  getWanConnection: async (networkData) => {
    console.log("Fetching WAN connection for:", networkData);
    // Simulate API call
    await new Promise((res) => setTimeout(res, 800));
    // In a real scenario, this would return data from the backend.
    // For now, we return mock data.
    return createSiteInternalTopology();
  },
};

// Helper function for generating a complex site topology (NO CHANGES)
const createSiteInternalTopology = () => {
  // ... (this function remains unchanged)
  const nodes = [];
  const links = [];
  const nodeTypes = ["Firewall", "Router", "Switch", "Server"];
  const width = 400;
  const height = 300;
  const numNodes = Math.floor(Math.random() * 3) + 4;

  for (let i = 0; i < numNodes; i++) {
    const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
    nodes.push({
      id: `internal-node-${i}`,
      name: `${type}-${i + 1}`,
      type: type,
      x: Math.random() * (width - 80) + 40,
      y: Math.random() * (height - 80) + 40,
    });
  }

  for (let i = 0; i < numNodes - 1; i++) {
    links.push({
      id: `link-${i}`,
      source: `internal-node-${i}`,
      target: `internal-node-${i + 1}`,
      status: Math.random() > 0.1 ? "up" : "down",
    });
  }

  const extraLinks = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < extraLinks; i++) {
    const sourceNode = nodes[Math.floor(Math.random() * numNodes)];
    const targetNode = nodes[Math.floor(Math.random() * numNodes)];
    const linkExists = links.some(
      (l) =>
        (l.source === sourceNode.id && l.target === targetNode.id) ||
        (l.source === targetNode.id && l.target === sourceNode.id)
    );
    if (sourceNode.id !== targetNode.id && !linkExists) {
      links.push({
        id: `extra-link-${i}`,
        source: sourceNode.id,
        target: targetNode.id,
        status: Math.random() > 0.1 ? "up" : "down",
      });
    }
  }

  return { nodes, links };
};

const TopologyLoader = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
    <svg
      className="animate-spin h-8 w-8 text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <p className="mt-2 text-sm">Loading Topology...</p>
  </div>
);

const SiteDetailPage = ({ siteGroup, initialTheme = "light" }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [expandedLinkId, setExpandedLinkId] = useState(null);
  const allDevices = useSelector(selectAllCoreDevices);

  const [topologyData, setTopologyData] = useState({ nodes: [], links: [] });
  const [topologyStatus, setTopologyStatus] = useState("loading");

  const deviceMap = useMemo(
    () => new Map(allDevices.map((d) => [d.id, d])),
    [allDevices]
  );

  useEffect(() => {
    const rootHtmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(rootHtmlElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(rootHtmlElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!siteGroup || siteGroup.length === 0) {
      setTopologyStatus("idle");
      return;
    }

    const fetchTopology = async () => {
      setTopologyStatus("loading");
      try {
        const primarySite = siteGroup[0];
        const device = deviceMap.get(primarySite.device_id);

        const networkData = {
          sda_site_id: primarySite.id,
          // Assuming `management_segment` is a property on your device object.
          // Adjust if the property name is different.
          management_segment: device?.management_segment || "default-segment",
        };

        // --- THIS IS THE FIX ---
        // 1. UNCOMMENTED: Use the real API call with the networkData variable.
        const data = await api.getWanConnection(networkData);

        // 2. REMOVED: The simulated API call is no longer needed here.

        setTopologyData(data);
        setTopologyStatus("succeeded");
      } catch (error) {
        console.error("Failed to fetch site topology:", error);
        setTopologyStatus("failed");
        // The fallback to mock data on error is a good pattern to keep.
        setTopologyData(createSiteInternalTopology());
      }
    };

    fetchTopology();
  }, [siteGroup, deviceMap]);

  // The rest of the component logic remains the same, but it's updated for correctness
  const siteConnectionsData = useMemo(() => {
    if (!siteGroup || siteGroup.length === 0) return [];
    return siteGroup.map((connection) => {
      const device = deviceMap.get(connection.device_id);
      return {
        id: connection.id,
        name: `Connection to ${device?.name || "Unknown Device"}`,
        description: `Interface ID: ${connection.interface_id}`,
        status: "up",
        ospfStatus: "N/A",
        mplsStatus: "N/A",
        bandwidth: "1 Gbps",
        additionalDetails: {
          mediaType: "Fiber/Copper",
          siteId: connection.id,
          deviceId: connection.device_id,
          deviceName: device?.name,
          interfaceId: connection.interface_id,
        },
      };
    });
  }, [siteGroup, deviceMap]);

  if (!siteGroup || siteGroup.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-800">
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Site data not found. Please select a site from the list.
        </p>
      </div>
    );
  }

  const primarySite = siteGroup[0];
  const isDark = theme === "dark";

  const handleLinkRowClick = (linkId) => {
    setExpandedLinkId((prevId) => (prevId === linkId ? null : linkId));
  };

  const nodeMap = new Map(topologyData.nodes.map((node) => [node.id, node]));
  const nodeColorMap = {
    Router: isDark ? "fill-blue-400" : "fill-blue-500",
    Switch: isDark ? "fill-teal-400" : "fill-teal-500",
    Firewall: isDark ? "fill-red-400" : "fill-red-500",
    Server: isDark ? "fill-purple-400" : "fill-purple-500",
  };

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen transition-colors duration-300">
      <div className="p-6">
        {/* --- TOP HEADER AREA (Two columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          {/* Left Side: Main Title and Description */}
          <header className="md:col-span-2">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
              {primarySite.site_name_english}
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mt-1">
              {primarySite.site_name_hebrew}
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-prose">
              This location serves as a key point of presence, hosting critical
              infrastructure for regional operations. It is engineered for high
              availability with fully redundant connections to the core network,
              ensuring uninterrupted service delivery and robust performance
              under all conditions.
            </p>
          </header>

          <section className="md:col-span-1">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-center md:text-left">
              Site Topology
              {topologyStatus === "failed" && (
                <span className="text-xs text-amber-500 ml-2">(Fallback)</span>
              )}
            </h2>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shadow-md flex items-center justify-center min-h-[200px]">
              {topologyStatus === "loading" && <TopologyLoader />}

              {(topologyStatus === "succeeded" ||
                topologyStatus === "failed") && (
                <svg
                  viewBox="0 0 400 300"
                  className="w-full h-auto"
                  role="img"
                  aria-label={`Internal topology diagram for ${primarySite.site_name_english}`}
                >
                  {topologyData.links.map((link) => {
                    const sourceNode = nodeMap.get(link.source);
                    const targetNode = nodeMap.get(link.target);
                    if (!sourceNode || !targetNode) return null;
                    const strokeColor =
                      link.status === "up"
                        ? isDark
                          ? "stroke-green-400"
                          : "stroke-green-500"
                        : isDark
                        ? "stroke-red-400"
                        : "stroke-red-500";
                    return (
                      <line
                        key={link.id}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        className={`${strokeColor} transition-colors`}
                        strokeWidth="2"
                      />
                    );
                  })}
                  {topologyData.nodes.map((node) => (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                    >
                      <circle
                        r="15"
                        className={`${
                          nodeColorMap[node.type] || "fill-gray-400"
                        } stroke-2 ${
                          isDark ? "stroke-gray-200" : "stroke-gray-900"
                        } transition-colors`}
                      />
                      <text
                        textAnchor="middle"
                        y="5"
                        className={`text-xs font-semibold ${
                          isDark ? "fill-gray-900" : "fill-white"
                        }`}
                      >
                        {node.name.split("-")[0].substring(0, 2)}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </section>
        </div>

        {/* --- MAIN CONTENT: Site Connections Table (Full Width) --- */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Site Connections ({siteConnectionsData.length})
          </h2>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bandwidth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {siteConnectionsData.length > 0 ? (
                  siteConnectionsData.flatMap((connection) => {
                    const isSelected = expandedLinkId === connection.id;
                    return (
                      <React.Fragment key={connection.id}>
                        <tr
                          className={`hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors ${
                            isSelected
                              ? isDark
                                ? "bg-slate-700"
                                : "bg-slate-100"
                              : ""
                          }`}
                          onClick={() => handleLinkRowClick(connection.id)}
                        >
                          <td className="px-4 py-3">
                            <StatusBulb status={connection.status} />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {connection.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {connection.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {connection.bandwidth}
                          </td>
                        </tr>
                        {isSelected && (
                          <tr className="border-l-4 border-blue-500 dark:border-blue-400">
                            <LinkDetailRow
                              link={connection}
                              isParentSelectedAndDark={isDark}
                            />
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center">
                      No connections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SiteDetailPage;
