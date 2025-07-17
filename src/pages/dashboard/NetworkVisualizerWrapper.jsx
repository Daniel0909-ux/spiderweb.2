// src/components/dashboard/NetworkVisualizerWrapper.jsx

import React, { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NetworkVisualizer from "../../components/chart/NetworkVisualizer";
import LinkDetailTabs from "../../components/shared/LinkDetailTabs";
import ToggleDetailButton from "../../components/chart/ToggleDetailButton";
import { fetchInitialData } from "../../redux/slices/authSlice";

// --- UPDATED: Data and Status Selectors from the new Redux slices ---
import {
  selectCoreSitesByNetworkId,
  selectCoreSitesStatus,
} from "../../redux/slices/coreSitesSlice";
import {
  selectAllCoreDevices,
  selectCoreDevicesStatus,
} from "../../redux/slices/coreDevicesSlice";
import {
  selectLinksByTypeId,
  selectTenGigLinksStatus,
} from "../../redux/slices/linksSlice";

// --- Feedback Components ---
import { LoadingSpinner } from "../../components/ui/feedback/LoadingSpinner";
import { ErrorMessage } from "../../components/ui/feedback/ErrorMessage";

// Helper function to select top devices (this logic is unchanged)
function selectTopTwoDevices(devices) {
  if (devices.length <= 2) return devices;
  const priorityOrder = [4, 5, 1, 2, 7, 8];
  const sortedDevices = [...devices].sort((a, b) => {
    const a_ending = parseInt(a.hostname.split("-").pop(), 10);
    const b_ending = parseInt(b.hostname.split("-").pop(), 10);
    const a_priority = priorityOrder.indexOf(a_ending);
    const b_priority = priorityOrder.indexOf(b_ending);
    const final_a_priority = a_priority === -1 ? 99 : a_priority;
    const final_b_priority = b_priority === -1 ? 99 : b_priority;
    return final_a_priority - final_b_priority;
  });
  return sortedDevices.slice(0, 2);
}

const NetworkVisualizerWrapper = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Local UI state (unchanged) ---
  const [openLinkTabs, setOpenLinkTabs] = useState([]);
  const [activeLinkTabId, setActiveLinkTabId] = useState(null);
  const [showDetailedLinks, setShowDetailedLinks] = useState(false);

  // --- UPDATED: Get the status of each required slice ---
  const coreSitesStatus = useSelector(selectCoreSitesStatus);
  const devicesStatus = useSelector(selectCoreDevicesStatus);
  const linksStatus = useSelector(selectTenGigLinksStatus);

  // --- UPDATED: Data selectors for L-Chart (networkId: 1) ---
  // 1. Get core sites specifically for this network (L-Chart).
  const coreSites = useSelector((state) =>
    selectCoreSitesByNetworkId(state, 1)
  );
  // 2. Get ALL core devices. We will filter them in the memoized selector below.
  const allCoreDevices = useSelector(selectAllCoreDevices);
  // 3. Get links (assuming this slice wasn't changed and still filters by a typeId).
  const linksRaw = useSelector((state) => selectLinksByTypeId(state, 1));

  // --- UPDATED: Memoized transformation to create graph data ---
  const graphData = useMemo(() => {
    // Guard clause: Don't run if the essential data isn't loaded yet.
    if (!coreSites.length || !allCoreDevices.length) {
      return { nodes: [], links: [] };
    }

    // A. Filter all devices to get only those belonging to the sites of this network.
    const coreSiteIdsForNetwork = new Set(coreSites.map((site) => site.id));
    const allDevicesForType = allCoreDevices.filter((device) =>
      coreSiteIdsForNetwork.has(device.core_site_id)
    );

    // B. Group the filtered devices by their parent site ID.
    const devicesByCoreSiteId = allDevicesForType.reduce((acc, device) => {
      const siteId = device.core_site_id;
      if (!acc[siteId]) {
        acc[siteId] = [];
      }
      acc[siteId].push(device);
      return acc;
    }, {});

    // C. Select the top N devices from each site group for visualization.
    const topDevicesPerSite = Object.values(devicesByCoreSiteId).flatMap(
      (deviceGroup) => selectTopTwoDevices(deviceGroup)
    );
    const visibleDeviceHostnames = new Set(
      topDevicesPerSite.map((d) => d.hostname)
    );

    // D. Create a lookup map for site names.
    const coreSiteMap = coreSites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {});

    // E. Transform the data into the final `nodes` and `links` format for D3.
    const transformedNodes = topDevicesPerSite.map((device) => ({
      id: device.hostname,
      group: "node",
      zone: coreSiteMap[device.core_site_id]?.name || "Unknown Zone", // Use .name from site
    }));

    const transformedLinks = linksRaw
      .filter(
        (link) =>
          visibleDeviceHostnames.has(link.source) &&
          visibleDeviceHostnames.has(link.target)
      )
      .map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        category: link.status,
      }));

    return { nodes: transformedNodes, links: transformedLinks };
  }, [coreSites, allCoreDevices, linksRaw]); // The dependency array is updated

  // --- All event handlers are unchanged ---
  const handleZoneClick = useCallback(
    (zoneId) => navigate(`zone/${zoneId}`),
    [navigate]
  );

  const handleNodeClick = useCallback(
    (nodeData) => {
      if (nodeData?.id && nodeData?.zone) {
        navigate(`zone/${nodeData.zone}/node/${nodeData.id}`);
      }
    },
    [navigate]
  );

  const handleLinkClick = useCallback(
    (linkDetailPayload) => {
      const { id, sourceNode, targetNode } = linkDetailPayload;
      const tabExists = openLinkTabs.some((tab) => tab.id === id);
      if (!tabExists) {
        const newTab = {
          id: id,
          title: `${sourceNode} - ${targetNode}`,
          type: "link",
          data: linkDetailPayload,
        };
        setOpenLinkTabs((prevTabs) => [...prevTabs, newTab]);
      }
      setActiveLinkTabId(id);
    },
    [openLinkTabs]
  );

  const handleCloseTab = useCallback(
    (tabIdToClose) => {
      setOpenLinkTabs((prevTabs) => {
        const remainingTabs = prevTabs.filter((tab) => tab.id !== tabIdToClose);
        if (activeLinkTabId === tabIdToClose) {
          setActiveLinkTabId(
            remainingTabs.length > 0
              ? remainingTabs[remainingTabs.length - 1].id
              : null
          );
        }
        return remainingTabs;
      });
    },
    [activeLinkTabId]
  );

  const handleToggleDetailView = useCallback(() => {
    setShowDetailedLinks((prev) => !prev);
  }, []);

  const handleRetry = () => dispatch(fetchInitialData());

  // --- UPDATED: Component-specific loading, error, and empty state logic ---
  const isLoading =
    coreSitesStatus === "loading" ||
    devicesStatus === "loading" ||
    linksStatus === "loading";

  const hasError =
    coreSitesStatus === "failed" ||
    devicesStatus === "failed" ||
    linksStatus === "failed";

  const isDataEmpty = !isLoading && !hasError && graphData.nodes.length === 0;

  if (isLoading) {
    return <LoadingSpinner text="Building L-Chart..." />;
  }

  if (hasError) {
    return (
      <ErrorMessage
        onRetry={handleRetry}
        message="Could not load the data needed for the L-Chart. Other parts of the application may still be functional."
      />
    );
  }

  if (isDataEmpty) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          No Data Available
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          There is no network data available to build the L-Chart.
        </p>
      </div>
    );
  }

  // --- Original component return for a successful data load (unchanged) ---
  return (
    <div className="w-full h-full flex flex-col">
      {openLinkTabs.length > 0 && (
        <div className="flex-shrink-0">
          <LinkDetailTabs
            tabs={openLinkTabs}
            activeTabId={activeLinkTabId}
            onSetActiveTab={setActiveLinkTabId}
            onCloseTab={handleCloseTab}
            theme={theme}
          />
        </div>
      )}

      <div className="flex-grow relative">
        <ToggleDetailButton
          isDetailed={showDetailedLinks}
          onToggle={handleToggleDetailView}
          theme={theme}
        />
        <NetworkVisualizer
          key={theme}
          data={graphData}
          theme={theme}
          showDetailedLinks={showDetailedLinks}
          onZoneClick={handleZoneClick}
          onLinkClick={handleLinkClick}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

export default NetworkVisualizerWrapper;
