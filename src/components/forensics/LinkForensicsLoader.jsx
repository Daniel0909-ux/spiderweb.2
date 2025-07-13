import React from "react";

// The component now accepts a 'theme' prop
export const LinkForensicsLoader = ({ theme = "dark" }) => {
  const isDark = theme === "dark";

  // Define theme-aware colors and classes
  const bgColor = isDark ? "bg-slate-900" : "bg-white";
  const titleColor = isDark ? "text-white" : "text-slate-800";
  const subtitleColor = isDark ? "text-slate-400" : "text-slate-500";
  const svgColor = isDark ? "#38bdf8" : "#0ea5e9";

  return (
    <div
      className={`w-full min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${bgColor}`}
    >
      <div className="forensics-loader-container absolute inset-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="forensics-particle"></div>
        ))}
      </div>
      <div className="relative z-10 text-center">
        <svg
          width="120"
          height="120"
          viewBox="0 0 50 50"
          className="mx-auto mb-6"
        >
          <circle cx="10" cy="10" r="3" fill={svgColor}>
            <animate
              attributeName="r"
              values="3;1;3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="40" cy="10" r="3" fill={svgColor}>
            <animate
              attributeName="r"
              values="3;1;3"
              dur="1.5s"
              begin="0.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="10" cy="40" r="3" fill={svgColor}>
            <animate
              attributeName="r"
              values="3;1;3"
              dur="1.5s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="40" cy="40" r="3" fill={svgColor}>
            <animate
              attributeName="r"
              values="3;1;3"
              dur="1.5s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="10"
            y1="10"
            x2="40"
            y2="40"
            stroke={svgColor}
            strokeWidth="0.5"
          >
            <animate
              attributeName="stroke-opacity"
              values="0;1;0"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="40"
            y1="10"
            x2="10"
            y2="40"
            stroke={svgColor}
            strokeWidth="0.5"
          >
            <animate
              attributeName="stroke-opacity"
              values="0;1;0"
              dur="1.5s"
              begin="0.2s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="10"
            y1="10"
            x2="40"
            y2="10"
            stroke={svgColor}
            strokeWidth="0.5"
          >
            <animate
              attributeName="stroke-opacity"
              values="0;1;0"
              dur="1.5s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="10"
            y1="40"
            x2="40"
            y2="40"
            stroke={svgColor}
            strokeWidth="0.5"
          >
            <animate
              attributeName="stroke-opacity"
              values="0;1;0"
              dur="1.5s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </line>
        </svg>

        <h2 className={`text-2xl font-bold tracking-wider ${titleColor}`}>
          Analyzing Link History...
        </h2>
        <p className={`mt-2 ${subtitleColor}`}>
          Collecting and correlating performance data points.
        </p>
      </div>
    </div>
  );
};
