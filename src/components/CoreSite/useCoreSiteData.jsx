// src/hooks/useCoreSiteData.js

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useNodeLayout } from "./useNodeLayout";

// --- Import new selectors ---
import { selectAllSites } from "../../redux/slices/sitesSlice";
// --- 1. THIS IS THE FIX: Import the new selector from linksSlice ---
import { selectLinksByNetworkId } from "../../redux/slices/linksSlice";
import { selectAllCoreDevices } from "../../redux/slices/coreDevicesSlice";
import { selectAllCoreSites } from "../../redux/slices/coreSitesSlice";

export function useCoreSiteData(chartType) {
  const { zoneId, nodeId: nodeIdFromUrl } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // --- Use new selectors ---
  const allCoreSites = useSelector(selectAllCoreSites);
  const allDevices = useSelector(selectAllCoreDevices);
  const allSites = useSelector(selectAllSites);

  // --- 2. THIS IS THE FIX: Use the new selector here ---
  // Determine the networkId (1 for L-Chart, 2 for P-Chart) and pass it to the selector.
  const networkId = chartType === "P" ? 2 : 1;
  const allLinksForChart = useSelector((state) =>
    selectLinksByNetworkId(state, networkId)
  );

  // --- Memoized logic for getting devices in the current zone (This part is correct) ---
  const devicesForZone = useMemo(() => {
    if (!zoneId || !allCoreSites.length || !allDevices.length) return [];
    const currentCoreSite = allCoreSites.find((site) => site.name === zoneId);
    if (!currentCoreSite) return [];
    return allDevices.filter(
      (device) => device.core_site_id === currentCoreSite.id
    );
  }, [zoneId, allDevices, allCoreSites]);

  // The rest of the hook is correct and does not need further changes.
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showExtendedNodes, setShowExtendedNodes] = useState(false);
  const [animateExtendedLayoutUp, setAnimateExtendedLayoutUp] = useState(false);
  const [previousSelectedNodeId, setPreviousSelectedNodeId] = useState(null);
  const [openDetailTabs, setOpenDetailTabs] = useState([]);
  const [activeDetailTabId, setActiveDetailTabId] = useState(null);

  const sitesForFocusedNode = useMemo(() => {
    if (!selectedNodeId || !allDevices.length || !allSites.length) {
      return [];
    }
    const focusedDevice = allDevices.find((d) => d.name === selectedNodeId);

    if (focusedDevice) {
      return allSites.filter((site) => site.device_id === focusedDevice.id);
    }
    return [];
  }, [allDevices, selectedNodeId, allSites]);

  useEffect(() => {
    if (devicesForZone.length > 0 && !selectedNodeId) {
      const initialNodeId = nodeIdFromUrl || devicesForZone[0].name;
      setSelectedNodeId(initialNodeId);
      setPreviousSelectedNodeId(initialNodeId);
    }
  }, [devicesForZone, nodeIdFromUrl, selectedNodeId]);

  useEffect(() => {
    if (showExtendedNodes) {
      setAnimateExtendedLayoutUp(false);
      const timer = setTimeout(() => setAnimateExtendedLayoutUp(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimateExtendedLayoutUp(false);
    }
  }, [showExtendedNodes]);

  useLayoutEffect(() => {
    setShowExtendedNodes(false);
  }, [zoneId]);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    if (containerRef.current) updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const {
    nodes: layoutNodes,
    links: layoutLinks,
    centerX,
    centerY,
  } = useNodeLayout(
    dimensions.width,
    dimensions.height,
    showExtendedNodes,
    animateExtendedLayoutUp,
    devicesForZone,
    allLinksForChart
  );

  const nodes = layoutNodes.filter((node) => node.id !== "None");
  const links = layoutLinks.filter(
    (link) => link.source.id !== "None" && link.target.id !== "None"
  );

  const handleToggleExtendedNodes = () => {
    setShowExtendedNodes((prevShowExtended) => {
      const nextShowExtended = !prevShowExtended;
      if (nextShowExtended) {
        setPreviousSelectedNodeId(selectedNodeId);
        const newSelected = devicesForZone[2]?.name;
        if (newSelected) setSelectedNodeId(newSelected);
      } else {
        setSelectedNodeId(previousSelectedNodeId || devicesForZone[0]?.name);
      }
      return nextShowExtended;
    });
  };

  const onNodeClickInZone = (clickedNodeData) => {
    if (!clickedNodeData || !clickedNodeData.id) {
      console.warn("Node data incomplete for action:", clickedNodeData);
      return;
    }
    if (clickedNodeData.id === selectedNodeId) {
      navigate(`node/${clickedNodeData.id}`);
    } else {
      setSelectedNodeId(clickedNodeData.id);
    }
  };

  const addOrActivateTab = useCallback((payload) => {
    const { id, type } = payload;
    const tabId = `${type}-${id}`;

    setOpenDetailTabs((prevTabs) => {
      const tabExists = prevTabs.some((tab) => tab.id === tabId);
      if (tabExists) {
        return prevTabs;
      }
      let title = "Details";
      if (type === "link") {
        title = `${payload.sourceNode} - ${payload.targetNode}`;
      } else if (type === "site") {
        title = payload.name;
      }
      return [...prevTabs, { id: tabId, type, title, data: payload }];
    });
    setActiveDetailTabId(tabId);
  }, []);

  const handleCloseTab = useCallback(
    (tabIdToClose) => {
      setOpenDetailTabs((prevTabs) => {
        const remainingTabs = prevTabs.filter((tab) => tab.id !== tabIdToClose);
        if (activeDetailTabId === tabIdToClose) {
          setActiveDetailTabId(
            remainingTabs.length > 0
              ? remainingTabs[remainingTabs.length - 1].id
              : null
          );
        }
        return remainingTabs;
      });
    },
    [activeDetailTabId]
  );

  const handleNavigateToSite = useCallback(
    (clickedSiteData) => {
      if (!clickedSiteData || !clickedSiteData.name) {
        console.error("Navigation failed: No site data provided.");
        return;
      }

      const targetSiteName = clickedSiteData.name;
      const siteGroup = allSites.filter(
        (site) => site.site_name_english === targetSiteName
      );

      if (siteGroup.length > 0) {
        const navId = encodeURIComponent(targetSiteName);
        navigate(`/sites/site/${navId}`, {
          state: { siteGroupData: siteGroup },
        });
      } else {
        console.error(
          "Could not find a matching site group for:",
          targetSiteName
        );
      }
    },
    [navigate, allSites]
  );

  const handleSiteClick = (siteData) => {
    const siteDetailPayload = {
      id: siteData.id,
      navId: `site-${siteData.id}`,
      name: siteData.site_name_english,
      type: "site",
      zone: zoneId,
      description: `Details for ${siteData.site_name_english}`,
    };
    addOrActivateTab(siteDetailPayload);
  };

  const handleLinkClick = (linkData) => {
    const newLinkPayload = {
      id: linkData.id || `link-${linkData.source.id}-${linkData.target.id}`,
      type: "link",
      sourceNode: linkData.source.id,
      targetNode: linkData.target.id,
      name: `Link: ${linkData.source.id} ↔ ${linkData.target.id}`,
      linkBandwidth: `${Math.floor(Math.random() * 1000) + 100} Gbps`,
      latency: `${Math.floor(Math.random() * 50) + 1} ms`,
      utilization: `${Math.floor(Math.random() * 100)}%`,
      status: Math.random() > 0.15 ? "up" : "down",
      linkId: linkData.id,
      linkDescription: "Core fiber optic interconnect.",
    };
    addOrActivateTab(newLinkPayload);
  };

  return {
    zoneId,
    containerRef,
    dimensions,
    nodes,
    links,
    centerX,
    centerY,
    selectedNodeId,
    showExtendedNodes,
    handleToggleExtendedNodes,
    devicesInZoneCount: devicesForZone.length,
    sitesForFocusedNode,
    onSiteClick: handleSiteClick,
    onLinkClick: handleLinkClick,
    onNodeClickInZone: onNodeClickInZone,
    openDetailTabs,
    activeDetailTabId,
    setActiveDetailTabId,
    handleCloseTab,
    handleNavigateToSite,
  };
}
