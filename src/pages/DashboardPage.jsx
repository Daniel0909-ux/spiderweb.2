// src/pages/DashboardPage.jsx

import React from "react";
import { useSelector } from "react-redux";
import {
  Routes,
  Route,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ArrowUp, ArrowDown, XCircle } from "lucide-react";

// Page Components
import FavoritesPage from "./dashboard/FavoritesPage";
import AllInterfacesPage from "./dashboard/AllInterfacesPage";
import LinkForensicsPage from "./dashboard/LinkForensicsPage";

// Chart and Site specific components
import NetworkVisualizerWrapper from "./dashboard/NetworkVisualizerWrapper";
import NetworkVisualizer5Wrapper from "./dashboard/NetworkVisualizer5Wrapper";
import CoreSitePage from "../components/CoreSite/CoreSitePage";
import SiteDetailPage from "../components/end-site/SiteDetailPage";
import EndSiteIndexPage from "../components/end-site/EndSiteIndexPage";
import LinkTable from "../components/CoreDevice/LinkTable";

// --- UPDATED: Helper hooks and Redux selectors ---
import { useRelatedDevices } from "../hooks/useRelatedDevices";
// 1. Import from the new coreDevicesSlice instead of the old devicesSlice
import { selectAllCoreDevices } from "../redux/slices/coreDevicesSlice";
import { selectAllSites } from "../redux/slices/sitesSlice";
import { selectAllTenGigLinks } from "../redux/slices/tenGigLinksSlice";

// This helper component can be used by other pages like FavoritesPage
function StatusIndicator({ status }) {
  const statusConfig = {
    Up: { color: "text-green-500", Icon: ArrowUp, label: "Up" },
    Down: { color: "text-red-500", Icon: ArrowDown, label: "Down" },
    "Admin Down": {
      color: "text-gray-500",
      Icon: XCircle,
      label: "Admin Down",
    },
  };
  const config = statusConfig[status] || statusConfig["Admin Down"];
  return (
    <div className={`flex items-center gap-2 font-medium ${config.color}`}>
      <config.Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}

// This component now correctly receives the theme prop to pass down.
function NodeDetailView({ chartType, theme }) {
  const { nodeId: deviceName, zoneId } = useParams(); // URL param is the device name

  // 2. Use the new selector to get all core devices
  const allDevices = useSelector(selectAllCoreDevices);
  const allSites = useSelector(selectAllSites);
  const allLinks = useSelector(selectAllTenGigLinks);
  const otherDevicesInZone = useRelatedDevices(deviceName, zoneId);

  const linksForTable = React.useMemo(() => {
    if (!deviceName || !allDevices.length || !allLinks.length) {
      return [];
    }
    const typeId = chartType === "P" ? 2 : 1;
    const allCoreLinksForChart = allLinks.filter(
      (link) => link.network_type_id === typeId
    );

    // 3. Update logic to use `d.name` which comes from the new API, instead of `d.hostname`
    const currentDevice = allDevices.find((d) => d.name === deviceName);
    if (!currentDevice) return [];

    const deviceMapByName = new Map(allDevices.map((d) => [d.name, d]));

    const interCoreLinks = allCoreLinksForChart
      .filter(
        (link) => link.source === deviceName || link.target === deviceName
      )
      .map((link) => {
        const otherDeviceName =
          link.source === deviceName ? link.target : link.source;
        const otherDevice = deviceMapByName.get(otherDeviceName);
        let linkType = "inter-core-different-site";

        // 4. Update logic to use `core_site_id` which is added by our new slice
        if (
          otherDevice &&
          otherDevice.core_site_id === currentDevice.core_site_id
        ) {
          linkType = "inter-core-same-site";
        }
        return {
          id: link.id,
          name: `Link to ${otherDeviceName}`,
          description: `Inter-Core Link (${
            linkType.includes("same") ? "Same Site" : "Different Site"
          })`,
          status: link.status,
          bandwidth: link.bandwidth,
          ospfStatus: "Enabled",
          mplsStatus: "Enabled",
          type: linkType,
        };
      });

    const coreToSiteLinks = allSites
      .filter((site) => site.device_id === currentDevice.id)
      .map((site) => ({
        id: `site-link-${site.id}`,
        name: site.site_name_english,
        description: "Connection to End-Site",
        status: "up",
        bandwidth: "1 Gbps",
        ospfStatus: "N/A",
        mplsStatus: "N/A",
        type: "core-to-site",
        additionalDetails: {
          mediaType: "Ethernet/Fiber",
          containerName: site.site_name_hebrew,
        },
      }));

    return [...interCoreLinks, ...coreToSiteLinks];
  }, [deviceName, chartType, allDevices, allSites, allLinks]);

  return (
    <div className="p-1">
      <LinkTable
        coreDeviceName={deviceName}
        coreSiteName={zoneId}
        linksData={linksForTable}
        otherDevicesInZone={otherDevicesInZone}
        theme={theme}
      />
    </div>
  );
}

export function DashboardPage({
  isAppFullscreen,
  theme,
  popupAnchorCoords,
  chartKeySuffix,
}) {
  return (
    <Routes>
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/all_interfaces" element={<AllInterfacesPage />} />

      <Route
        path="/forensics/link/:linkId"
        element={<LinkForensicsPage theme={theme} />}
      />

      {/* The routing structure itself does not need to change */}
      <Route
        path="/l-chart/*"
        element={
          <Routes>
            <Route
              index
              element={
                <div
                  className={`relative w-full h-full ${
                    !isAppFullscreen && "rounded-lg shadow-sm"
                  } overflow-hidden bg-white dark:bg-gray-900`}
                >
                  <NetworkVisualizerWrapper
                    key={`l-visualizer-${chartKeySuffix}-${theme}`}
                    theme={theme}
                  />
                </div>
              }
            />
            <Route
              path="zone/:zoneId/node/:nodeId"
              element={<NodeDetailView chartType="L" theme={theme} />}
            />
            <Route
              path="zone/:zoneId"
              element={
                <CoreSitePage
                  theme={theme}
                  popupAnchor={popupAnchorCoords}
                  chartType="L"
                />
              }
            />
          </Routes>
        }
      />

      <Route
        path="/p-chart/*"
        element={
          <Routes>
            <Route
              index
              element={
                <div
                  className={`relative w-full h-full ${
                    !isAppFullscreen && "rounded-lg shadow-sm"
                  } overflow-hidden bg-white dark:bg-gray-900`}
                >
                  <NetworkVisualizer5Wrapper
                    key={`p-visualizer-${chartKeySuffix}-${theme}`}
                    theme={theme}
                  />
                </div>
              }
            />
            <Route
              path="zone/:zoneId/node/:nodeId"
              element={<NodeDetailView chartType="P" theme={theme} />}
            />
            <Route
              path="zone/:zoneId"
              element={
                <CoreSitePage
                  theme={theme}
                  popupAnchor={popupAnchorCoords}
                  chartType="P"
                />
              }
            />
          </Routes>
        }
      />

      <Route
        path="/sites/*"
        element={
          <Routes>
            <Route index element={<EndSiteIndexPage />} />
            <Route
              path="site/:siteNavId"
              element={<SiteDetailPageRouteElement />}
            />
          </Routes>
        }
      />

      {/* Default routes (unchanged) */}
      <Route path="/" element={<Navigate to="/favorites" replace />} />
      <Route path="*" element={<Navigate to="/favorites" replace />} />
    </Routes>
  );
}

// This helper component for the sites route remains unchanged.
function SiteDetailPageRouteElement() {
  const location = useLocation();
  const siteGroupFromState = location.state?.siteGroupData;

  return siteGroupFromState ? (
    <SiteDetailPage
      siteGroup={siteGroupFromState}
      initialTheme={
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      }
    />
  ) : (
    <Navigate to="/sites" replace />
  );
}
