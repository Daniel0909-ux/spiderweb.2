// src/components/NetworkVisualizer5Wrapper.jsx

import React, { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NetworkVisualizer5 from "../../components/chart/NetworkVisualizer5";
import LinkDetailTabs from "../../components/shared/LinkDetailTabs";
import ToggleDetailButton from "../../components/chart/ToggleDetailButton";
import { fetchInitialData } from "../../redux/slices/authSlice";

// --- Data Selectors ---
import { selectPikudimByTypeId } from "../../redux/slices/corePikudimSlice";
import { selectDevicesByTypeId } from "../../redux/slices/devicesSlice";
import { selectLinksByTypeId } from "../../redux/slices/tenGigLinksSlice";

// --- NEW: Import Status Selectors ---
const selectPikudimStatus = (state) => state.corePikudim.status;
const selectDevicesStatus = (state) => state.devices.status;
const selectLinksStatus = (state) => state.tenGigLinks.status;

// --- Feedback Components ---
import { LoadingSpinner } from "../../components/ui/feedback/LoadingSpinner";
import { ErrorMessage } from "../../components/ui/feedback/ErrorMessage";

// Helper function to select top devices (no changes)
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

const NetworkVisualizer5Wrapper = ({ theme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- NEW: Get the status of each required slice ---
  const pikudimStatus = useSelector(selectPikudimStatus);
  const devicesStatus = useSelector(selectDevicesStatus);
  const linksStatus = useSelector(selectLinksStatus);

  // Local UI state
  const [openLinkTabs, setOpenLinkTabs] = useState([]);
  const [activeLinkTabId, setActiveLinkTabId] = useState(null);
  const [showDetailedLinks, setShowDetailedLinks] = useState(false);

  // --- IMPORTANT: Selectors use typeId: 2 for P-Chart data ---
  const pikudim = useSelector((state) => selectPikudimByTypeId(state, 2));
  const allDevicesForType = useSelector((state) =>
    selectDevicesByTypeId(state, 2)
  );
  const linksRaw = useSelector((state) => selectLinksByTypeId(state, 2));

  // Memoized data transformation for the graph
  const graphData = useMemo(() => {
    if (!pikudim.length || !allDevicesForType.length) {
      return { nodes: [], links: [] };
    }

    const devicesByPikudId = allDevicesForType.reduce((acc, device) => {
      const siteId = device.core_pikudim_site_id;
      if (!acc[siteId]) {
        acc[siteId] = [];
      }
      acc[siteId].push(device);
      return acc;
    }, {});

    const topDevicesPerPikud = Object.values(devicesByPikudId).flatMap(
      (deviceGroup) => selectTopTwoDevices(deviceGroup)
    );

    const visibleDeviceHostnames = new Set(
      topDevicesPerPikud.map((d) => d.hostname)
    );

    const pikudimMap = pikudim.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
    const transformedNodes = topDevicesPerPikud.map((device) => ({
      id: device.hostname,
      group: "node",
      zone:
        pikudimMap[device.core_pikudim_site_id]?.core_site_name ||
        "Unknown Zone",
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
  }, [pikudim, allDevicesForType, linksRaw]);

  // All event handlers (unchanged)
  const handleZoneClick = useCallback(
    (zoneId) => {
      navigate(`zone/${zoneId}`);
    },
    [navigate]
  );

  const handleNodeClick = useCallback(
    (nodeData) => {
      if (nodeData && nodeData.id && nodeData.zone) {
        navigate(`zone/${nodeData.zone}/node/${nodeData.id}`);
      } else {
        console.warn("Node data incomplete for navigation:", nodeData);
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
          if (remainingTabs.length > 0) {
            setActiveLinkTabId(remainingTabs[remainingTabs.length - 1].id);
          } else {
            setActiveLinkTabId(null);
          }
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

  // --- NEW: Component-specific derived states for rendering logic ---
  const isLoading =
    pikudimStatus === "loading" ||
    devicesStatus === "loading" ||
    linksStatus === "loading";

  const hasError =
    pikudimStatus === "failed" ||
    devicesStatus === "failed" ||
    linksStatus === "failed";

  const isDataEmpty = !isLoading && !hasError && graphData.nodes.length === 0;

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner text="Building P-Chart..." />;
  }

  // Render error state if any dependency fails
  if (hasError) {
    return (
      <ErrorMessage
        onRetry={handleRetry}
        message="Could not load the data needed for the P-Chart. Other parts of the application may still be functional."
      />
    );
  }

  // Render empty state if data loads successfully but is empty
  if (isDataEmpty) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          No Data Available
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          There is no network data available to build the P-Chart.
        </p>
      </div>
    );
  }

  // --- Original component return for successful data load ---
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
        <NetworkVisualizer5
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

export default NetworkVisualizer5Wrapper;
