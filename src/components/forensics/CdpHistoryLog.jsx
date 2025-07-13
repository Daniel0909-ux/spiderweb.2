import React from "react";

// Redefine the fixed widget HOC here as well
const ForensicWidget = ({ title, children, theme }) => {
  const isDark = theme === "dark";
  return (
    <div
      className={`rounded-lg p-4 shadow-lg ${
        isDark
          ? "bg-slate-800/50 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <h3
        className={`font-bold text-lg mb-4 ${
          isDark ? "text-slate-200" : "text-slate-800"
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
};

const CdpEvent = ({ event, theme }) => {
  const isDark = theme === "dark";
  const timestampColor = isDark ? "text-slate-400" : "text-slate-500";
  const labelColor = isDark ? "text-slate-500" : "text-slate-600";
  const valueColor = isDark ? "text-slate-300" : "text-slate-700";

  return (
    <div
      className={`border-l-2 pl-4 py-2 ${
        isDark ? "border-slate-600" : "border-slate-300"
      }`}
    >
      <p className={`text-xs font-mono ${timestampColor}`}>
        {new Date(event.timestamp).toLocaleString()}
      </p>
      <p
        className={`font-semibold ${
          isDark ? "text-amber-400" : "text-amber-600"
        }`}
      >
        NEIGHBOR CHANGE DETECTED
      </p>
      <div className="text-xs mt-2 space-y-1">
        <p>
          <span className={`font-bold ${labelColor}`}>PREV:</span>{" "}
          <span className={valueColor}>
            {event.previous.device} ({event.previous.port})
          </span>
        </p>
        <p>
          <span className={`font-bold ${valueColor}`}>NEW:</span>{" "}
          <span className={valueColor}>
            {event.new.device} ({event.new.port})
          </span>
        </p>
      </div>
    </div>
  );
};

export const CdpHistoryLog = ({ cdpEvents, theme }) => {
  const isDark = theme === "dark";
  return (
    <ForensicWidget title="CDP Neighbor History" theme={theme}>
      {cdpEvents.length === 0 ? (
        <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>
          No CDP neighbor changes in this period.
        </p>
      ) : (
        <div className="space-y-4">
          {cdpEvents.map((event, i) => (
            <CdpEvent key={i} event={event} theme={theme} />
          ))}
        </div>
      )}
    </ForensicWidget>
  );
};
