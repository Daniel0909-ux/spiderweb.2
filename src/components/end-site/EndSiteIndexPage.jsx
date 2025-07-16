// src/components/end-site/EndSiteIndexPage.jsx

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";

// --- 1. UPDATED: Data & Slices ---
import {
  selectAllSites,
  selectSitesStatus,
} from "../../redux/slices/sitesSlice";
import {
  selectAllCoreDevices,
  selectCoreDevicesStatus,
} from "../../redux/slices/coreDevicesSlice";
import {
  selectAllCoreSites,
  selectCoreSitesStatus,
} from "../../redux/slices/coreSitesSlice";
import { fetchInitialData } from "../../redux/slices/authSlice";

// --- UI & Feedback Components ---
import { GridSkeleton } from "../ui/feedback/GridSkeleton";
import { ErrorMessage } from "../ui/feedback/ErrorMessage";

// The SiteCard component needs to be updated to use the new data structures
const SiteCard = ({ siteGroup, deviceMap, coreSiteMap, onClick }) => {
  const primarySite = siteGroup[0];
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-transparent dark:hover:border-blue-500 hover:border-blue-400 flex flex-col h-full"
    >
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 truncate">
          {primarySite.site_name_english}
        </h3>
        <p
          className="text-sm text-gray-500 dark:text-gray-400 truncate"
          title={primarySite.site_name_hebrew}
        >
          {primarySite.site_name_hebrew}
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-3">
        {siteGroup.map((site) => {
          const device = deviceMap.get(site.device_id);
          // 2. UPDATED: Look up the core site using the device's foreign key
          const coreSite = device ? coreSiteMap.get(device.core_site_id) : null;
          return (
            <div key={site.id}>
              <p>
                <strong>Device:</strong> {device?.name || "N/A"}
              </p>
              <p>
                <strong>Core Site:</strong> {coreSite?.name || "N/A"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function EndSiteIndexPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const parentRef = useRef(null);

  // --- 3. UPDATED: Get Data and Status from Redux ---
  const allSites = useSelector(selectAllSites);
  const allDevices = useSelector(selectAllCoreDevices);
  const allCoreSites = useSelector(selectAllCoreSites);

  const sitesStatus = useSelector(selectSitesStatus);
  const devicesStatus = useSelector(selectCoreDevicesStatus);
  const coreSitesStatus = useSelector(selectCoreSitesStatus);

  // --- 4. UPDATED: Memoized data processing ---
  const deviceMap = useMemo(
    () => new Map(allDevices.map((d) => [d.id, d])),
    [allDevices]
  );
  // Create a map for core sites instead of pikudim
  const coreSiteMap = useMemo(
    () => new Map(allCoreSites.map((p) => [p.id, p])),
    [allCoreSites]
  );
  const groupedSites = useMemo(() => {
    return allSites.reduce((acc, site) => {
      const key = site.site_name_english;
      if (!acc[key]) acc[key] = [];
      acc[key].push(site);
      return acc;
    }, {});
  }, [allSites]);
  const filteredSiteGroups = useMemo(() => {
    const allGroups = Object.values(groupedSites);
    if (!searchTerm) return allGroups;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allGroups.filter((siteGroup) => {
      const representativeSite = siteGroup[0];
      return (
        representativeSite.site_name_english
          .toLowerCase()
          .includes(lowercasedFilter) ||
        representativeSite.site_name_hebrew.includes(lowercasedFilter)
      );
    });
  }, [groupedSites, searchTerm]);

  // --- Event Handlers (no changes) ---
  const handleSiteClick = (siteGroup) => {
    const navId = encodeURIComponent(siteGroup[0].site_name_english);
    navigate(`/sites/site/${navId}`, { state: { siteGroupData: siteGroup } });
  };

  const handleRetry = () => {
    dispatch(fetchInitialData());
  };

  // --- Virtualization Logic (no changes) ---
  const [columnCount, setColumnCount] = useState(5);
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1280) setColumnCount(5);
      else if (window.innerWidth >= 1024) setColumnCount(4);
      else if (window.innerWidth >= 768) setColumnCount(3);
      else if (window.innerWidth >= 640) setColumnCount(2);
      else setColumnCount(1);
    };
    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredSiteGroups.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // --- Resilient Rendering Logic ---
  const renderContent = () => {
    // 5. UPDATED: Check status of new slices
    const isLoading =
      sitesStatus === "loading" ||
      devicesStatus === "loading" ||
      coreSitesStatus === "loading";
    const hasError =
      sitesStatus === "failed" ||
      devicesStatus === "failed" ||
      coreSitesStatus === "failed";

    if (isLoading) {
      return <GridSkeleton count={15} />;
    }
    if (hasError) {
      return (
        <ErrorMessage
          onRetry={handleRetry}
          message="Failed to load site data."
        />
      );
    }
    if (filteredSiteGroups.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            No sites found matching your search.
          </p>
        </div>
      );
    }

    // This is the successful render path
    return (
      <div ref={parentRef} className="w-full h-full overflow-y-auto pr-2">
        <div
          key={columnCount}
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const cardsInRow = [];
            const startIndex = virtualRow.index * columnCount;
            const endIndex = Math.min(
              startIndex + columnCount,
              filteredSiteGroups.length
            );

            for (let i = startIndex; i < endIndex; i++) {
              const siteGroup = filteredSiteGroups[i];
              cardsInRow.push(
                <SiteCard
                  key={siteGroup[0].site_name_english}
                  siteGroup={siteGroup}
                  deviceMap={deviceMap}
                  // 6. UPDATED: Pass the new coreSiteMap
                  coreSiteMap={coreSiteMap}
                  onClick={() => handleSiteClick(siteGroup)}
                />
              );
            }

            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-1">
                  {cardsInRow}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          All End-Sites
        </h1>
        <p className="text-md text-gray-600 dark:text-gray-400 mt-1">
          Browse and search for a specific site to view its details.
        </p>
      </header>

      <div className="mb-8 flex-shrink-0">
        <input
          type="text"
          placeholder="Search by English or Hebrew name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-lg p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="flex-grow min-h-0">{renderContent()}</div>
    </div>
  );
}
