// src/components/ui/NotificationCard.jsx

import React from "react";
import { MdClose, MdError, MdWarning, MdInfo } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const AlertIcon = ({ type, className = "" }) => {
  if (type === "error")
    return <MdError className={`text-red-500 ${className}`} />;
  if (type === "warning")
    return <MdWarning className={`text-yellow-500 ${className}`} />;
  return <MdInfo className={`text-blue-500 ${className}`} />;
};

export function NotificationCard({ alert, onDismiss }) {
  const navigate = useNavigate();

  const handleViewClick = () => {
    // --- THIS IS THE CORE CHANGE ---
    // Navigate to the alerts page and pass the alert's ID in the location state.
    // This state object will be available on the destination page.
    navigate("/notifications", {
      state: { openAlertId: alert.id },
    });

    // We still call onDismiss to clear the notification toast itself.
    onDismiss();
  };

  return (
    <div className="p-4 w-full">
      <div className="flex items-start space-x-3">
        <AlertIcon type={alert.type} className="w-6 h-6 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {alert.message}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleViewClick}
              className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              View
            </button>
            {/* The dismiss button is now always visible, which is better UX */}
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MdClose size={18} />
        </button>
      </div>
    </div>
  );
}
