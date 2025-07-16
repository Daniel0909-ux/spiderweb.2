// src/hooks/useInterfaceData.js

/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { faker } from "@faker-js/faker";

// --- 1. UPDATED: Redux Imports ---
import { selectAllSites } from "../redux/slices/sitesSlice";
import { selectAllTenGigLinks } from "../redux/slices/tenGigLinksSlice";
// Import from the new coreDevicesSlice
import { selectAllCoreDevices } from "../redux/slices/coreDevicesSlice";
import {
  selectFavoriteIds,
  toggleFavoriteLink,
} from "../redux/slices/favoritesSlice";

export function useInterfaceData() {
  const dispatch = useDispatch();

  // --- 2. UPDATED: Use the new selector ---
  const allSites = useSelector(selectAllSites) || [];
  const allTenGigLinks = useSelector(selectAllTenGigLinks) || [];
  // Use the selector for the new slice
  const allDevices = useSelector(selectAllCoreDevices) || [];
  const favoriteIds = useSelector(selectFavoriteIds) || [];

  // This part is correct, as it maps by the device's primary key `id`.
  const deviceMap = useMemo(
    () => new Map(allDevices.map((d) => [d.id, d])),
    [allDevices]
  );

  // --- 3. UPDATED: deviceFilterOptions to use `name` ---
  const deviceFilterOptions = useMemo(() => {
    // The device object now has `name` instead of `hostname`.
    const deviceNames = allDevices.map((device) => device.name);
    return ["all", ...deviceNames.sort()];
  }, [allDevices]);

  // --- 4. UPDATED: Data transformation logic ---
  const interfaces = useMemo(() => {
    // --- A. Transform Site Connections into the common format ---
    const siteConnections = allSites.map((site) => {
      const device = deviceMap.get(site.device_id);
      return {
        id: `site-${site.id}-${site.device_id}`,
        // Use `device?.name` instead of `device?.hostname`
        deviceName: device?.name || "Unknown Device",
        interfaceName: `Port ${site.interface_id}`,
        description: `Connection to site: ${site.site_name_english}`,
        status: "Up",
        trafficIn: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        trafficOut: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        errors: {
          in: faker.number.int({ max: 5 }),
          out: faker.number.int({ max: 2 }),
        },
        linkType: "regular",
      };
    });

    // --- B. Transform 10-Gigabit Core Links (This part is unchanged as it doesn't use the device list) ---
    const tenGigCoreLinks = allTenGigLinks.map((link) => {
      const formattedStatus =
        link.status.charAt(0).toUpperCase() + link.status.slice(1);
      const randomLinkType = faker.helpers.arrayElement([
        "regular",
        "bundle",
        "tunneling",
      ]);
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
        linkType: randomLinkType,
      };
    });

    const allLinks = [...siteConnections, ...tenGigCoreLinks];

    // D. Add the `isFavorite` property to each item
    return allLinks.map((link) => ({
      ...link,
      isFavorite: favoriteIds.includes(link.id),
    }));
  }, [allSites, allTenGigLinks, deviceMap, favoriteIds]);

  // --- Step 4: Create a stable function to handle user actions (Unchanged) ---
  const handleToggleFavorite = useCallback(
    (linkId) => {
      dispatch(toggleFavoriteLink(linkId));
    },
    [dispatch]
  );

  // --- Step 5: Return the final data and the action handler ---
  return { interfaces, handleToggleFavorite, deviceFilterOptions };
}
