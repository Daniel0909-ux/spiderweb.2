import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAllCoreDevices } from "../redux/slices/coreDevicesSlice";
import { selectAllCoreSites } from "../redux/slices/coreSitesSlice";

export function useRelatedDevices(currentDeviceName, currentZoneName) {
  const allDevices = useSelector(selectAllCoreDevices);
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

    const devicesInSameSite = allDevices.filter(
      (device) => device.core_site_id === currentSiteId
    );

    const otherDevices = devicesInSameSite.filter(
      (device) => device.hostname !== currentDeviceName // Assuming the device object still has 'hostname'
    );

    return otherDevices.map((device) => ({
      ...device,
      zoneName: currentZoneName,
    }));
  }, [currentDeviceName, currentZoneName, allDevices, allCoreSites]);

  return relatedDevices;
}
