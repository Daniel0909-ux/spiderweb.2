/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { faker } from "@faker-js/faker";

// --- Redux Imports ---
import { selectAllSites } from "../redux/slices/sitesSlice";
import { selectAllTenGigLinks } from "../redux/slices/tenGigLinksSlice";
import { selectAllDevices } from "../redux/slices/devicesSlice";
import {
  selectFavoriteIds,
  toggleFavoriteLink,
} from "../redux/slices/favoritesSlice";

/**
 * The "Single Source of Truth" Hook for all network connections.
 */
export function useInterfaceData() {
  const dispatch = useDispatch();

  // --- THIS IS THE FIX: Provide a fallback empty array for each selector ---
  // This ensures that even if the state is temporarily missing during a re-render,
  // the variables will be empty arrays `[]` instead of `undefined`.
  const allSites = useSelector(selectAllSites) || [];
  const allTenGigLinks = useSelector(selectAllTenGigLinks) || [];
  const allDevices = useSelector(selectAllDevices) || [];
  const favoriteIds = useSelector(selectFavoriteIds) || [];

  // --- Step 2: Create efficient lookup maps (memoized for performance) ---
  const deviceMap = useMemo(
    () => new Map(allDevices.map((d) => [d.id, d])),
    [allDevices]
  );

  const deviceFilterOptions = useMemo(() => {
    const hostnames = allDevices.map((device) => device.hostname);
    return ["all", ...hostnames.sort()];
  }, [allDevices]);

  // --- Step 3: Transform, combine, and merge all data (the core logic) ---
  // This code will now work safely because `allSites` and `allTenGigLinks` are guaranteed to be arrays.
  const interfaces = useMemo(() => {
    // --- A. Transform Site Connections into the common format ---
    const siteConnections = allSites.map((site) => {
      const device = deviceMap.get(site.device_id);
      return {
        id: `site-${site.id}-${site.device_id}`,
        deviceName: device?.hostname || "Unknown Device",
        interfaceName: `Port ${site.interface_id}`,
        description: `Connection to site: ${site.site_name_english}`,
        status: "Up", // This might need to come from real data later
        trafficIn: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        trafficOut: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        errors: {
          in: faker.number.int({ max: 5 }),
          out: faker.number.int({ max: 2 }),
        },
      };
    });

    // B. Transform 10-Gigabit Core Links into the common format
    const tenGigCoreLinks = allTenGigLinks.map((link) => {
      const formattedStatus =
        link.status.charAt(0).toUpperCase() + link.status.slice(1);
      return {
        id: link.id,
        deviceName: `${link.source} <-> ${link.target}`,
        interfaceName: `10G Inter-Core Link`,
        description: `Inter-site trunk (${link.bandwidth || "N/A"})`,
        status: formattedStatus === "Issue" ? "Down" : formattedStatus,
        trafficIn: `${faker.number.float({
          min: 1,
          max: 9,
          precision: 0.1,
        })} Gbps`,
        trafficOut: `${faker.number.float({
          min: 1,
          max: 9,
          precision: 0.1,
        })} Gbps`,
        errors: {
          in: faker.number.int({ max: 20 }),
          out: faker.number.int({ max: 15 }),
        },
      };
    });

    // C. Combine all transformed data into one master array
    const allLinks = [...siteConnections, ...tenGigCoreLinks];

    // D. Add the `isFavorite` property to each item
    return allLinks.map((link) => ({
      ...link,
      isFavorite: favoriteIds.includes(link.id),
    }));
  }, [allSites, allTenGigLinks, deviceMap, favoriteIds]);

  // --- Step 4: Create a stable function to handle user actions ---
  const handleToggleFavorite = useCallback(
    (linkId) => {
      dispatch(toggleFavoriteLink(linkId));
    },
    [dispatch]
  );

  // --- Step 5: Return the final data and the action handler ---
  return { interfaces, handleToggleFavorite, deviceFilterOptions };
}
