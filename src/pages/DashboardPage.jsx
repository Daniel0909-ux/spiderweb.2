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
import { selectLinksByNetworkId } from "../redux/slices/linksSlice";

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

function NodeDetailView({ chartType, theme }) {
  const { nodeId: deviceName, zoneId: coreSiteName } = useParams();

  const allDevices = useSelector(selectAllCoreDevices);
  const allEndSites = useSelector(selectAllSites);
  const otherDevicesInZone = useRelatedDevices(deviceName, coreSiteName);

  // --- THIS IS THE FIX ---
  // 1. Determine the network ID based on the chart type.
  const networkId = chartType === "P" ? 2 : 1;
  // 2. Use the correct, more efficient selector to get only the links for this specific network.
  const linksForNetwork = useSelector((state) =>
    selectLinksByNetworkId(state, networkId)
  );

  const linksForTable = React.useMemo(() => {
    // 3. The guard clause now checks `linksForNetwork`.
    if (!deviceName || !linksForNetwork || !allDevices.length) {
      return [];
    }

    const currentDevice = allDevices.find((d) => d.name === deviceName);
    if (!currentDevice) return [];

    const deviceMapByName = new Map(allDevices.map((d) => [d.name, d]));

    // 4. The filtering logic now operates on the pre-filtered `linksForNetwork` array.
    const interCoreLinks = linksForNetwork
      .filter(
        (link) =>
          link.type === "core-to-core" && // Still good to be explicit with type
          (link.source === deviceName || link.target === deviceName)
      )
      .map((link) => {
        const otherDeviceName =
          link.source === deviceName ? link.target : link.source;
        const otherDevice = deviceMapByName.get(otherDeviceName);
        let linkType = "inter-core-different-site";
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

    const coreToEndSiteLinks = allEndSites
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

    return [...interCoreLinks, ...coreToEndSiteLinks];
    // 5. Update the dependency array to use `linksForNetwork`.
  }, [deviceName, allDevices, allEndSites, linksForNetwork]);

  return (
    <div className="p-1">
      <LinkTable
        coreDeviceName={deviceName}
        coreSiteName={coreSiteName}
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
