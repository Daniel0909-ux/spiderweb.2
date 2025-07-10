import React from "react";

// This component displays the expanded details for an interface.
// It receives the full interface object.
const InterfaceDetailRow = ({ interfaceData }) => {
  // Mock details for demonstration. In a real app, this data would
  // come from the interfaceData object itself.
  const details = {
    mediaType: "10GBASE-LR",
    lastFlap: "2 weeks ago",
    mtu: 9216,
    encapsulation: "ARPA",
    crcErrors: interfaceData.errors.in,
    inputRate: interfaceData.trafficIn,
    outputRate: interfaceData.trafficOut,
  };

  return (
    // The background color is a slightly different shade to stand out.
    <div className="bg-slate-100 dark:bg-slate-800 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Media Type:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.mediaType}
          </p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Last Flap:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.lastFlap}
          </p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            MTU:
          </span>
          <p className="text-slate-800 dark:text-slate-100">{details.mtu}</p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Encapsulation:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.encapsulation}
          </p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            CRC Errors:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.crcErrors}
          </p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Input Rate:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.inputRate}
          </p>
        </div>
        <div>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Output Rate:
          </span>
          <p className="text-slate-800 dark:text-slate-100">
            {details.outputRate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterfaceDetailRow;
