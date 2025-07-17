// src/hooks/useInterfaceData.js

/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { faker } from "@faker-js/faker";

// --- Redux Imports (Updated) ---
import { selectAllSites } from "../redux/slices/sitesSlice";
import { selectAllLinks } from "../redux/slices/linksSlice";
import { selectAllCoreDevices } from "../redux/slices/coreDevicesSlice";
import {
  selectFavoriteIds,
  toggleFavoriteLink,
} from "../redux/slices/favoritesSlice";

export function useInterfaceData() {
  const dispatch = useDispatch();

  // --- Selectors using new slices ---
  const allSites = useSelector(selectAllSites) || []; // These are end-site connections
  const allLinks = useSelector(selectAllLinks) || []; // These are core-to-core links
  const allDevices = useSelector(selectAllCoreDevices) || [];
  const favoriteIds = useSelector(selectFavoriteIds) || [];

  // --- Step 2: Create efficient lookup maps (memoized for performance) ---
  const deviceMap = useMemo(
    () => new Map(allDevices.map((d) => [d.id, d])),
    [allDevices]
  );

  const deviceFilterOptions = useMemo(() => {
    // Use the `name` property from the new device objects
    const deviceNames = allDevices.map((device) => device.name);
    return ["all", ...deviceNames.sort()];
  }, [allDevices]);

  // --- Step 3: Transform, combine, and merge all data (the core logic) ---
  const interfaces = useMemo(() => {
    // --- A. Transform Core-to-End-Site Connections ---
    // The `allSites` slice represents the connections from core devices to end sites.
    const siteConnections = allSites.map((site) => {
      const device = deviceMap.get(site.device_id);
      return {
        id: `site-${site.id}-${site.device_id}`,
        // Use `device.name` instead of `hostname`
        deviceName: device?.name || "Unknown Device",
        interfaceName: `Port ${site.interface_id}`,
        description: `Connection to site: ${site.site_name_english}`,
        status: "Up", // This might need to come from real data later
        trafficIn: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        trafficOut: `${faker.number.int({ min: 1, max: 800 })} Mbps`,
        errors: {
          in: faker.number.int({ max: 5 }),
          out: faker.number.int({ max: 2 }),
        },
        linkType: "regular",
      };
    });

    // --- B. Transform Core-to-Core Links ---
    // The `allLinks` slice represents these. We filter for the correct type.
    const coreToCoreLinks = allLinks
      .filter((link) => link.type === "core-to-core")
      .map((link) => {
        const formattedStatus =
          link.status.charAt(0).toUpperCase() + link.status.slice(1);
        const randomLinkType = faker.helpers.arrayElement([
          "regular",
          "bundle",
          "tunneling",
        ]);

        return {
          id: link.id,
          // The source/target on these links are the device names
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

    // --- C. Combine the two lists ---
    const allInterfaceRows = [...siteConnections, ...coreToCoreLinks];

    // --- D. Add the `isFavorite` property to each item ---
    return allInterfaceRows.map((link) => ({
      ...link,
      isFavorite: favoriteIds.includes(link.id),
    }));
  }, [allSites, allLinks, deviceMap, favoriteIds]); // Updated dependencies

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
