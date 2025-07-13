import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { generateLinkForensicsData } from "../../redux/dummyData";
import { TimeRangeSelector } from "../../components/forensics/TimeRangeSelector";
import { BandwidthChart } from "../../components/forensics/BandwidthChart";
import { ErrorChart } from "../../components/forensics/ErrorChart";
import { EventTimeline } from "../../components/forensics/EventTimeline";
import { CdpHistoryLog } from "../../components/forensics/CdpHistoryLog";
import { ArrowUp, ArrowDown } from "lucide-react";
import { LinkForensicsLoader } from "../../components/forensics/LinkForensicsLoader";

const StatusIndicator = ({ status, theme }) => {
  const isDark = theme === "dark";
  const isUp = status === "Up";
  const colorClass = isUp
    ? isDark
      ? "text-emerald-400"
      : "text-emerald-600"
    : isDark
    ? "text-red-400"
    : "text-red-500";
  return (
    <div className={`flex items-center gap-2 font-medium ${colorClass}`}>
      {isUp ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
      <span>{status}</span>
    </div>
  );
};

// Generic widget wrapper now accepts a theme prop
const ForensicWidget = ({ title, children, theme }) => {
  const isDark = theme === "dark";
  return (
    // Before: bg-slate-800/50
    // After: A conditional class for a clean white background in light mode.
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
// The main page component now accepts the theme prop
export default function LinkForensicsPage({ theme = "dark" }) {
  const { linkId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("7d");
  const isDark = theme === "dark";

  useEffect(() => {
    setIsLoading(true); // Set loading to true before fetching
    setData(null); // Clear old data

    // Simulate network delay
    const timer = setTimeout(() => {
      const days = {
        "30m": 1 / 48,
        "2h": 1 / 12,
        "24h": 1,
        "7d": 7,
        "1m": 30,
        "6m": 180,
      }[selectedRange];
      const linkData = generateLinkForensicsData(linkId, days);
      setData(linkData);
      setIsLoading(false); // Set loading to false after data is ready
    }, 1500); // 1.5 second delay to see the animation

    return () => clearTimeout(timer); // Cleanup timer
  }, [selectedRange, linkId]);

  // --- 2. Use the new loading state to render the loader ---
  if (isLoading || !data) {
    return <LinkForensicsLoader theme={theme} />;
  }

  // Use the theme to determine the page's background color
  const pageBgClass = isDark ? "bg-slate-900" : "bg-slate-50";
  const headerTextColor = isDark ? "text-white" : "text-slate-900";
  const subHeaderTextColor = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div
      className={`p-6 min-h-screen transition-colors duration-300 ${pageBgClass}`}
    >
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${headerTextColor}`}>
            Link Status History
          </h1>
          <p className={`font-mono ${subHeaderTextColor}`}>{data.linkId}</p>
        </div>
        <div className="flex items-center gap-6">
          <StatusIndicator status={data.currentStatus.physical} theme={theme} />
          <TimeRangeSelector
            selectedRange={selectedRange}
            onSelectRange={setSelectedRange}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <EventTimeline
            theme={theme}
            physicalEvents={data.eventData.physical}
            protocolEvents={data.eventData.protocol}
            selectedRange={selectedRange}
          />
        </div>

        <ForensicWidget title="Bandwidth Utilization (TX/RX)" theme={theme}>
          <BandwidthChart
            data={data.bandwidthData}
            maxBandwidth={data.maxBandwidth}
            theme={theme}
          />
        </ForensicWidget>

        <ForensicWidget title="Error & Drop Rates" theme={theme}>
          <ErrorChart data={data.bandwidthData} theme={theme} />
        </ForensicWidget>

        <div className="lg:col-span-2">
          <CdpHistoryLog cdpEvents={data.eventData.cdp} theme={theme} />
        </div>
      </div>
    </div>
  );
}
