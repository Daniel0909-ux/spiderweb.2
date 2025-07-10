import React from "react";
import { NotificationCard } from "./NotificationCard";

/**
 * A styled wrapper that gives the notification a consistent "toast" appearance.
 * It contains the NotificationCard for the actual content.
 */
export function NotificationToast({ alert, onDismiss }) {
  if (!alert) return null;

  // Determine the color for the left border based on the alert type
  const borderColorClass =
    alert.type === "error"
      ? "border-red-500"
      : alert.type === "warning"
      ? "border-yellow-500"
      : "border-blue-500";

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 ${borderColorClass}`}
    >
      <NotificationCard alert={alert} onDismiss={onDismiss} />
    </div>
  );
}
