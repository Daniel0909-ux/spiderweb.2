import React from "react";

/**
 * A generic wrapper for dashboard widgets to ensure consistent styling.
 */
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

const TimeAxis = ({ selectedRange }) => {
  const now = new Date();
  let labels = [];

  // Logic to generate appropriate labels based on the time range
  switch (selectedRange) {
    case "30m":
      // Show labels every 10 minutes for a 30-minute window
      labels = [
        new Date(now.getTime() - 30 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(now.getTime() - 20 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(now.getTime() - 10 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ];
      break;
    case "2h":
      // Show labels every 30 minutes for a 2-hour window
      labels = [
        new Date(now.getTime() - 120 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(now.getTime() - 90 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(now.getTime() - 60 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(now.getTime() - 30 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ];
      break;
    case "24h":
      // Show labels for every 6 hours
      labels = Array.from({ length: 5 }).map((_, i) =>
        new Date(now.getTime() - (24 - i * 6) * 3600 * 1000).toLocaleTimeString(
          [],
          { hour: "numeric" }
        )
      );
      break;
    case "7d":
      // Show labels for each of the last 7 days
      labels = Array.from({ length: 8 }).map((_, i) =>
        new Date(now.getTime() - (7 - i) * 24 * 3600 * 1000).toLocaleDateString(
          [],
          { month: "short", day: "numeric" }
        )
      );
      break;
    default:
      // Default for 1m and 6m (can be made more sophisticated)
      labels = ["Start", "End"];
      break;
  }

  return (
    <div className="flex justify-between w-full mt-1">
      {labels.map((label, i) => (
        <span key={i} className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </span>
      ))}
    </div>
  );
};

export const EventTimeline = ({
  physicalEvents,
  protocolEvents,
  theme,
  selectedRange,
}) => {
  const isDark = theme === "dark";
  const subheaderColor = isDark ? "text-slate-400" : "text-slate-600";

  // Define theme-aware colors for the timeline bars
  const physicalUpBg = isDark ? "bg-emerald-500/20" : "bg-emerald-500/30";
  const physicalDownBg = isDark ? "bg-red-500/80" : "bg-red-500";

  const protocolUpBg = isDark ? "bg-sky-500/20" : "bg-sky-500/30";
  const protocolFlapBg = isDark ? "bg-amber-500/80" : "bg-amber-500";

  // Helper function to calculate an event's position on the timeline
  const calculatePosition = (eventTimestamp, rangeInMs) => {
    const now = new Date().getTime();
    const eventTime = new Date(eventTimestamp).getTime();
    const startOffset = now - eventTime;
    // Return position as a percentage from the right edge
    return (startOffset / rangeInMs) * 100;
  };

  // Map the selected range string to its duration in milliseconds
  const rangeToMs = {
    "30m": 30 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
    "6m": 180 * 24 * 60 * 60 * 1000,
  };
  const totalDurationMs = rangeToMs[selectedRange];

  return (
    <ForensicWidget title="Status Timeline" theme={theme}>
      <div className="space-y-4">
        {/* Physical Status Timeline */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${subheaderColor}`}>
            Physical Status
          </h4>
          <div
            className={`w-full h-8 rounded-lg relative overflow-hidden ${physicalUpBg}`}
          >
            {physicalEvents.map((event, i) => {
              const eventDurationMs =
                new Date(event.end).getTime() - new Date(event.start).getTime();
              const width = (eventDurationMs / totalDurationMs) * 100;
              const right = calculatePosition(event.end, totalDurationMs);
              return (
                <div
                  key={`p-${i}`}
                  className={`absolute h-full rounded-sm ${physicalDownBg}`}
                  // Use right positioning for a timeline where "now" is on the right
                  style={{
                    right: `${right}%`,
                    width: `${Math.max(width, 0.5)}%`,
                  }}
                  title={`Down from ${new Date(
                    event.start
                  ).toLocaleString()} to ${new Date(
                    event.end
                  ).toLocaleString()}`}
                />
              );
            })}
          </div>
        </div>
        {/* Protocol Status Timeline */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${subheaderColor}`}>
            Protocol Status
          </h4>
          <div
            className={`w-full h-8 rounded-lg relative overflow-hidden ${protocolUpBg}`}
          >
            {protocolEvents.map((event, i) => {
              const eventDurationMs =
                new Date(event.end).getTime() - new Date(event.start).getTime();
              const width = (eventDurationMs / totalDurationMs) * 100;
              const right = calculatePosition(event.end, totalDurationMs);
              return (
                <div
                  key={`l-${i}`}
                  className={`absolute h-full rounded-sm ${protocolFlapBg}`}
                  style={{
                    right: `${right}%`,
                    width: `${Math.max(width, 0.5)}%`,
                  }}
                  title={`${event.state} from ${new Date(
                    event.start
                  ).toLocaleString()} to ${new Date(
                    event.end
                  ).toLocaleString()}`}
                />
              );
            })}
          </div>
        </div>

        {/* Render the new TimeAxis component at the bottom */}
        <TimeAxis selectedRange={selectedRange} />
      </div>
    </ForensicWidget>
  );
};
