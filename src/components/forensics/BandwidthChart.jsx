import React from "react";
// --- 1. Import ReferenceLine from recharts ---
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-slate-700/80 text-white rounded-md border border-slate-600 shadow-lg text-xs">
        <p className="font-bold">{new Date(label).toLocaleString()}</p>
        <p className="text-cyan-400">{`Transmit: ${payload[0].value.toFixed(
          2
        )} Mbps`}</p>
        <p className="text-emerald-400">{`Receive: ${payload[1].value.toFixed(
          2
        )} Mbps`}</p>
      </div>
    );
  }
  return null;
};

export const BandwidthChart = ({ data, maxBandwidth, theme }) => {
  const isDark = theme === "dark";
  const textColor = isDark ? "#94a3b8" : "#64748b"; // slate-400 / slate-500
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0"; // slate-200
  const axisStroke = isDark ? "#475569" : "#cbd5e1"; // slate-600 / slate-300

  // Define colors for lines/areas
  const txColor = isDark ? "#22d3ee" : "#0ea5e9"; // cyan-400 / sky-500
  const rxColor = isDark ? "#34d399" : "#10b981"; // emerald-400 / emerald-500
  const capacityColor = isDark ? "#f87171" : "#ef4444"; // red-400 / red-500

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={txColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={txColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={rxColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={rxColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            tick={{ fill: textColor, fontSize: 12 }}
            stroke={axisStroke}
          />
          <YAxis
            tickFormatter={(val) => `${val / 1000} G`}
            tick={{ fill: textColor, fontSize: 12 }}
            stroke={axisStroke}
            domain={[0, (dataMax) => Math.max(dataMax, maxBandwidth) * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: textColor }} iconType="circle" />
          <ReferenceLine
            y={maxBandwidth}
            label={{
              value: "Capacity",
              position: "insideTopRight",
              fill: capacityColor,
              fontSize: 10,
              dy: 10,
              dx: -10,
            }}
            stroke={capacityColor}
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="tx"
            name="Transmit"
            stroke={txColor}
            fillOpacity={1}
            fill="url(#colorTx)"
          />
          <Area
            type="monotone"
            dataKey="rx"
            name="Receive"
            stroke={rxColor}
            fillOpacity={1}
            fill="url(#colorRx)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
