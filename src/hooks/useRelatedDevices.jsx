import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAllDevices } from "../redux/slices/devicesSlice";
import { selectAllCoreSites } from "../redux/slices/coreSitesSlice";

export function useRelatedDevices(currentDeviceName, currentZoneName) {
  const allDevices = useSelector(selectAllDevices);
  const allCoreSites = useSelector(selectAllCoreSites);

  const relatedDevices = useMemo(() => {
    // This console.log is great for debugging
    // console.log("Hook called with:", { currentDeviceName, currentZoneName });

    if (
      !currentDeviceName ||
      !currentZoneName ||
      !allDevices.length ||
      !allCoreSites.length
    ) {
      return [];
    }

    const currentCoreSite = allCoreSites.find(
      (site) => site.name === currentZoneName // property is now 'name'
    );
    if (!currentCoreSite) {
      return [];
    }
    const currentSiteId = currentCoreSite.id;

    // The property name `core_pikudim_site_id` on the device object might also need
    // updating depending on the backend, but we'll assume it's still correct for now.
    const devicesInSameSite = allDevices.filter(
      (device) => device.core_pikudim_site_id === currentSiteId
    );

    const otherDevices = devicesInSameSite.filter(
      (device) => device.hostname !== currentDeviceName
    );

    return otherDevices.map((device) => ({
      ...device,
      zoneName: currentZoneName,
    }));
  }, [currentDeviceName, currentZoneName, allDevices, allCoreSites]);

  return relatedDevices;
}
