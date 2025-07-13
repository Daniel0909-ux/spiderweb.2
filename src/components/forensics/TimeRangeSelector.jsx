import React from "react";

const timeRanges = [
  { value: "30m", label: "30m" },
  { value: "2h", label: "2h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "1m", label: "1m" },
  { value: "6m", label: "6m" },
];

export const TimeRangeSelector = ({ selectedRange, onSelectRange }) => {
  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      {timeRanges.map((range) => (
        <button
          key={range.value}
          onClick={() => onSelectRange(range.value)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
            selectedRange === range.value
              ? "bg-white dark:bg-slate-900/80 text-blue-600 dark:text-blue-300 shadow"
              : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};
