import React, { useState, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MdErrorOutline,
  MdWarningAmber,
  MdInfoOutline,
  MdNotifications,
  MdClose,
  MdSearch,
  MdFilterListOff,
  MdAutorenew,
  MdRefresh,
  MdStar,
  MdStarBorder,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAlerts,
  deleteAlert,
  favoriteAlert,
  selectAllAlerts,
  selectAlertsStatus,
} from "../redux/slices/alertsSlice";

// --- HELPER COMPONENTS ---

const AlertIcon = ({ type, size = 24 }) => {
  if (type === "error")
    return (
      <MdErrorOutline className="text-red-500 flex-shrink-0" size={size} />
    );
  if (type === "warning")
    return (
      <MdWarningAmber className="text-yellow-500 flex-shrink-0" size={size} />
    );
  return <MdInfoOutline className="text-blue-500 flex-shrink-0" size={size} />;
};

const AlertModal = ({ alert, onClose }) => {
  const dispatch = useDispatch();

  if (!alert) return null;

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this alert? This action cannot be undone."
      )
    ) {
      dispatch(deleteAlert(alert.id));
      onClose(); // Close the modal after the action is dispatched
    }
  };

  const handleFavorite = () => {
    dispatch(favoriteAlert(alert.id));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <MdClose size={24} />
        </button>
        <div className="flex items-start space-x-3 mb-4">
          <AlertIcon type={alert.type} size={32} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Alert Details
            </h2>
            <p
              className={`text-sm font-medium ${
                alert.type === "error"
                  ? "text-red-600 dark:text-red-400"
                  : alert.type === "warning"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              Type: {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <p>
            <strong className="text-gray-700 dark:text-gray-300">
              Message:
            </strong>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              {alert.message}
            </span>
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-300">
              Timestamp:
            </strong>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              {new Date(alert.timestamp).toLocaleString()}
            </span>
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-300">
              Network Line:
            </strong>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              {alert.networkLine}
            </span>
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-300">
              Source:
            </strong>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              {alert.source}
            </span>
          </p>
          <p>
            <strong className="text-gray-700 dark:text-gray-300">
              Severity Score:
            </strong>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              {alert.severityScore}/10
            </span>
          </p>
          <div className="pt-2">
            <strong className="text-gray-700 dark:text-gray-300 block mb-1">
              Details:
            </strong>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-xs leading-relaxed">
              {alert.details}
            </p>
          </div>
          <p>
            <strong className="text-gray-700 dark:text-gray-300">ID:</strong>
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
              {alert.id}
            </span>
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={handleFavorite}
            title={
              alert.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className="p-2 rounded-full text-gray-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
          >
            {alert.isFavorite ? (
              <MdStar size={24} className="text-yellow-500" />
            ) : (
              <MdStarBorder size={24} className="hover:text-yellow-600" />
            )}
          </button>

          <div className="space-x-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
            >
              Delete Alert
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ alert, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-transparent dark:hover:border-blue-500 hover:border-blue-400 flex flex-col h-full"
    >
      {/* NEW: Conditionally render the favorite star */}
      {alert.isFavorite && (
        <div
          className="absolute top-2 right-2 text-yellow-400"
          title="Favorited"
        >
          <MdStar size={20} />
        </div>
      )}
      <div className="flex items-start space-x-4 flex-grow">
        <AlertIcon type={alert.type} size={28} />
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-gray-800 dark:text-white truncate"
            title={alert.message}
          >
            {alert.message}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Network Line:</strong> {alert.networkLine}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const timePeriods = [
  { label: "1 Hour", value: "1h" },
  { label: "10 Hours", value: "10h" },
  { label: "24 Hours", value: "24h" },
  { label: "1 Week", value: "1w" },
  { label: "All Time", value: "all" },
];
const alertTypes = [
  { value: "error", label: "Errors", color: "red" },
  { value: "warning", label: "Warnings", color: "yellow" },
  { value: "info", label: "Info", color: "blue" },
];
const initialTypeState = { error: true, warning: true, info: true };

const TypeFilterButton = ({ typeInfo, count, isActive, onClick }) => {
  const colors = {
    red: {
      active: "bg-red-500 text-white shadow-md",
      inactive:
        "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
    },
    yellow: {
      active: "bg-yellow-500 text-white shadow-md",
      inactive:
        "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
    },
    blue: {
      active: "bg-blue-500 text-white shadow-md",
      inactive:
        "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
    },
  };
  const countColors = {
    red: { active: "bg-white/20", inactive: "bg-black/10 dark:bg-white/10" },
    yellow: { active: "bg-white/20", inactive: "bg-black/10 dark:bg-white/10" },
    blue: { active: "bg-white/20", inactive: "bg-black/10 dark:bg-white/10" },
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-center px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out flex items-center justify-center gap-2 ${
        isActive
          ? colors[typeInfo.color].active
          : colors[typeInfo.color].inactive
      }`}
    >
      <span>{typeInfo.label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-mono transition-colors duration-200 ${
          isActive
            ? countColors[typeInfo.color].active
            : countColors[typeInfo.color].inactive
        }`}
      >
        {count}
      </span>
    </button>
  );
};

export function AlertsPage() {
  const dispatch = useDispatch();
  const allAlerts = useSelector(selectAllAlerts);
  const status = useSelector(selectAlertsStatus);
  const location = useLocation(); // <-- 2. Get the location object
  const navigate = useNavigate();

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1w");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState(initialTypeState);
  const parentRef = useRef(null);
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    // Check if we have state and an `openAlertId` property from the navigation.
    const alertIdToOpen = location.state?.openAlertId;

    if (alertIdToOpen) {
      // Find the full alert object from our master list in Redux.
      const alertToSelect = allAlerts.find((a) => a.id === alertIdToOpen);

      if (alertToSelect) {
        // If we found it, trigger the same logic as if we had clicked on it.
        setSelectedAlert(alertToSelect);
        setIsModalOpen(true);

        // IMPORTANT: Clear the state from the location object.
        // This prevents the modal from re-opening if the user refreshes the page.
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, allAlerts, navigate, location.pathname]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchAllAlerts());
    }
  }, [status, dispatch]);

  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1024) setColumnCount(3);
      else if (window.innerWidth >= 768) setColumnCount(2);
      else setColumnCount(1);
    };
    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  // --- CORRECTED EFFECT ---
  useEffect(() => {
    // Only run the logic if there is a selected alert
    if (selectedAlert) {
      // Find the latest version of this alert in the main Redux store list
      const updatedAlert = allAlerts.find((a) => a.id === selectedAlert.id);

      if (updatedAlert) {
        // If the alert still exists, update our local state to match it.
        // This is important for seeing the "favorite" star change instantly.
        setSelectedAlert(updatedAlert);
      } else {
        // If the alert is not found, it means it was deleted.
        // We should close the modal automatically.
        handleCloseModal();
      }
    }
  }, [allAlerts, selectedAlert]); // <-- The corrected dependency array

  // NEW: Step 1 - Sort the alerts first
  const sortedAlerts = useMemo(() => {
    if (!Array.isArray(allAlerts)) return [];
    // Create a shallow copy to avoid mutating the original state
    return [...allAlerts].sort((a, b) => {
      // Prioritize favorited items
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // For items with the same favorite status, sort by newest first
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [allAlerts]);

  // MODIFIED: Step 2 - Filter the *sorted* list by time
  const timeFilteredAlerts = useMemo(() => {
    const now = new Date();
    // Use the newly created sortedAlerts list
    const alertsWithDate = sortedAlerts.map((a) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));

    switch (selectedPeriod) {
      case "1h":
        return alertsWithDate.filter(
          (a) => a.timestamp >= new Date(now.getTime() - 1 * 60 * 60 * 1000)
        );
      case "10h":
        return alertsWithDate.filter(
          (a) => a.timestamp >= new Date(now.getTime() - 10 * 60 * 60 * 1000)
        );
      case "24h":
        return alertsWithDate.filter(
          (a) => a.timestamp >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
        );
      case "1w":
        return alertsWithDate.filter(
          (a) =>
            a.timestamp >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        );
      default:
        return alertsWithDate;
    }
  }, [sortedAlerts, selectedPeriod]); // Depends on the sorted list now

  const alertCountsByType = useMemo(() => {
    return timeFilteredAlerts.reduce(
      (acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      },
      { error: 0, warning: 0, info: 0 }
    );
  }, [timeFilteredAlerts]);

  const filteredAlerts = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return timeFilteredAlerts.filter((alert) => {
      if (!selectedTypes[alert.type]) return false;
      if (
        lowercasedTerm &&
        !alert.message.toLowerCase().includes(lowercasedTerm) &&
        !alert.networkLine.toLowerCase().includes(lowercasedTerm)
      )
        return false;
      return true;
    });
  }, [timeFilteredAlerts, searchTerm, selectedTypes]);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredAlerts.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  const handleTypeChange = (type) =>
    setSelectedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTypes(initialTypeState);
  };
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };
  const handleRefresh = () => {
    dispatch(fetchAllAlerts());
  };

  const renderContent = () => {
    if (status === "loading" && allAlerts.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center text-center px-4">
          <div>
            <MdAutorenew
              size={56}
              className="mx-auto text-blue-500 animate-spin mb-4"
            />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              Loading Alerts...
            </p>
          </div>
        </div>
      );
    }
    if (filteredAlerts.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center text-center px-4">
          <div>
            <MdNotifications
              size={56}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              No Matching Alerts
            </p>
            <p className="text-md text-gray-500 dark:text-gray-500 mt-2">
              Try adjusting your time or type filters.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div ref={parentRef} className="w-full h-full overflow-y-auto pr-2">
        <div
          key={columnCount}
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const cardsInRow = [];
            const startIndex = virtualRow.index * columnCount;
            const endIndex = Math.min(
              startIndex + columnCount,
              filteredAlerts.length
            );
            for (let i = startIndex; i < endIndex; i++) {
              const alert = filteredAlerts[i];
              cardsInRow.push(
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onClick={() => handleAlertClick(alert)}
                />
              );
            }
            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-1"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {cardsInRow}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
        <header className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            System Alerts
          </h1>
          <p className="text-md text-gray-600 dark:text-gray-400 mt-1">
            Review and filter real-time alerts from the network infrastructure.
          </p>
        </header>
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mb-8 flex-shrink-0">
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 block">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 ${
                    selectedPeriod === period.value
                      ? "bg-blue-600 text-white shadow"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
            <div className="flex-shrink-0">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                Type
              </label>
              <div className="flex w-full sm:w-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                {alertTypes.map((typeInfo) => (
                  <TypeFilterButton
                    key={typeInfo.value}
                    typeInfo={typeInfo}
                    count={alertCountsByType[typeInfo.value] || 0}
                    isActive={selectedTypes[typeInfo.value]}
                    onClick={() => handleTypeChange(typeInfo.value)}
                  />
                ))}
              </div>
            </div>
            <div className="flex-grow"></div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <MdSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="search"
                  type="text"
                  placeholder="Search message or line..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={status === "loading"}
                title="Refresh Alerts"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdRefresh
                  className={status === "loading" ? "animate-spin" : ""}
                />
                <span>
                  {status === "loading" ? "Refreshing..." : "Refresh"}
                </span>
              </button>
              <button
                onClick={handleResetFilters}
                title="Reset filters"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MdFilterListOff />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-grow min-h-0">{renderContent()}</div>
      </div>
      {isModalOpen && selectedAlert && (
        <AlertModal alert={selectedAlert} onClose={handleCloseModal} />
      )}
    </>
  );
}
