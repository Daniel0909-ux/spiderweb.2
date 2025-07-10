import React, { useState, useEffect } from "react";
import { NotificationToast } from "./NotificationToast";

/**
 * Manages the logic (hover state, auto-dismiss timer) for a single toast.
 * It does NOT handle animation itself.
 */
export function FloatingToastItem({ alert, onDismiss }) {
  const [isHovered, setIsHovered] = useState(false);

  // This useEffect hook sets a timer to automatically dismiss the notification.
  // It will be paused if the user is hovering over the toast.
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isHovered) {
        // We call the onDismiss function passed from the parent
        // after the timeout.
        onDismiss(alert.id);
      }
    }, 7000); // 7-second life for each toast

    // Cleanup function to clear the timer if the component unmounts
    // (e.g., if the user dismisses it manually).
    return () => clearTimeout(timerId);
  }, [alert.id, isHovered, onDismiss]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NotificationToast
        alert={alert}
        // Ensure the dismiss button works by calling the parent's handler
        onDismiss={() => onDismiss(alert.id)}
      />
    </div>
  );
}
