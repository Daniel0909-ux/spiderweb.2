import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-700/80 text-white rounded-lg border border-slate-600 shadow-xl text-sm backdrop-blur-sm">
        <p className="font-bold mb-2">{new Date(label).toLocaleString()}</p>
        <div className="space-y-1">
          {payload.map((pld, i) => (
            // Use pld.fill for BarChart color, pld.color/stroke for AreaChart
            <div
              key={i}
              style={{ color: pld.fill }}
              className="flex items-center"
            >
              <span className="font-semibold">{`${pld.name}: `}</span>
              <span className="ml-2 font-mono">{pld.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ErrorChart = ({ data, theme }) => {
  const isDark = theme === "dark";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0";
  const axisStroke = isDark ? "#475569" : "#cbd5e1";

  const errorData = data.filter(
    (d) => d.crcErrors > 0 || d.inputDrops > 0 || d.outputDrops > 0
  );

  if (errorData.length === 0) {
    return (
      <div
        className={`h-60 flex items-center justify-center ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        <p>No Errors or Drops in this period.</p>
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer>
        <BarChart data={errorData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            tick={{ fill: textColor, fontSize: 12 }}
            stroke={axisStroke}
          />
          <YAxis tick={{ fill: textColor, fontSize: 12 }} stroke={axisStroke} />
          <Tooltip
            cursor={{ fill: "rgba(100, 116, 139, 0.2)" }}
            content={<CustomTooltip />}
          />
          <Legend wrapperStyle={{ color: textColor }} iconType="circle" />
          <Bar
            dataKey="crcErrors"
            name="CRC Errors"
            fill={isDark ? "#f87171" : "#ef4444"}
          />
          <Bar
            dataKey="inputDrops"
            name="Input Drops"
            fill={isDark ? "#f59e0b" : "#d97706"}
          />
          <Bar
            dataKey="outputDrops"
            name="Output Drops"
            fill={isDark ? "#eab308" : "#ca8a04"}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
