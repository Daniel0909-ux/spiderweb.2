import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Star, LogOut } from "lucide-react";

// --- Redux Imports ---
import { logout } from "../../redux/slices/authSlice";
import {
  disconnect,
  selectRealtimeStatus,
} from "../../redux/slices/realtimeSlice";
import {
  selectCurrentNotifications, // Use the plural selector for the list
  dismissNotification, // Use the action for dismissing a single item
} from "../../redux/slices/uiSlice";

// --- Helper Components & Hooks ---
import { useDashboardLogic } from "../../pages/useDashboardLogic";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { FloatingNotification } from "../ui/FloatingNotification";
import { Sidebar } from "../ui/sidebar";

// --- Page Components ---
import { DashboardPage } from "../../pages/DashboardPage";
import { AdminPanelPage } from "../../pages/AdminPanelPage";
import { AlertsPage } from "../../pages/AlertsPage";
import SearchPage from "../../pages/SearchPage";

// --- Local Helper Components for this Layout ---

// Icons used for the fullscreen toggle in the header.
export const FullscreenIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9.75 9.75M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L14.25 9.75M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9.75 14.25m10.5 6.05v-4.5m0 4.5h-4.5m4.5 0L14.25 14.25"
    />
  </svg>
);

export const ExitFullscreenIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25"
    />
  </svg>
);

// Real-time status indicator component
const RealtimeStatusIndicator = () => {
  const status = useSelector(selectRealtimeStatus);

  const config = {
    connected: { color: "bg-green-500", text: "Live" },
    connecting: { color: "bg-yellow-500", text: "Connecting" },
    disconnected: { color: "bg-red-500", text: "Offline" },
  }[status] || { color: "bg-gray-500", text: "Unknown" };

  return (
    <div
      className="flex items-center gap-2"
      title={`Real-time updates: ${config.text}`}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${config.color} relative`}>
        {status === "connected" && (
          <div
            className={`absolute inset-0 w-full h-full rounded-full ${config.color} animate-ping`}
          ></div>
        )}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">
        {config.text}
      </span>
    </div>
  );
};

// --- Main AppLayout Component ---

function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  // --- THIS IS THE FIX: Use the correct selector and action ---
  const notifications = useSelector(selectCurrentNotifications);

  const handleDismissNotification = (alertId) => {
    dispatch(dismissNotification(alertId));
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const activePageLabel = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/admin")) return "Admin Panel";
    if (path.startsWith("/search")) return "Search";
    if (path.startsWith("/notifications")) return "Alerts";
    if (path.startsWith("/help")) return "Help";
    if (path.startsWith("/settings")) return "Settings";
    return "Dashboard";
  }, [location.pathname]);

  // --- MODIFICATION 1: Determine which pages have tabs ---
  // The tabs should only show on the main dashboard.
  const pageHasTabs = activePageLabel === "Dashboard";

  // --- MODIFICATION 2: Determine which pages can be fullscreened ---
  // Any page that isn't a simple settings/help page can be fullscreen.
  const pageCanBeFullscreen = [
    "Dashboard",
    "Search",
    "Admin Panel",
    "Alerts",
  ].includes(activePageLabel);

  const dashboardLogic = useDashboardLogic({
    isAppFullscreen: isFullscreen,
    isSidebarCollapsed,
  });
  const { activeTabValue, handleTabChangeForNavigation } = dashboardLogic;

  // --- MODIFICATION 3: Update the toggle logic ---
  const toggleFullscreen = () => {
    // Only allow toggling if the current page supports it.
    if (!pageCanBeFullscreen) return;
    setIsFullscreen(!isFullscreen);
  };

  const handleLogout = () => {
    // First, disconnect the real-time service to clean up the interval.
    dispatch(disconnect());
    // Then, clear the user's session data.
    dispatch(logout());
    // Finally, navigate back to the login page.
    navigate("/login", { replace: true });
  };

  // --- MODIFICATION 4: Update the render logic for the button ---
  const renderFullscreenToggleButton = () => {
    // Only render the button if the page supports it.
    if (!pageCanBeFullscreen) return null;

    const ButtonIcon = isFullscreen ? ExitFullscreenIcon : FullscreenIcon;
    const buttonTitle = isFullscreen ? "Exit Fullscreen" : "Fullscreen";

    return (
      <button
        onClick={toggleFullscreen}
        title={buttonTitle}
        aria-label={buttonTitle}
        className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ButtonIcon className="w-5 h-5" />
      </button>
    );
  };

  const showFloatingNotifications = isFullscreen || isSidebarCollapsed;

  return (
    <>
      {/* 1. Render the FloatingNotification component OUTSIDE the main layout div. */}
      {/* It is now a sibling, not a child, so it won't be clipped. */}
      {showFloatingNotifications && (
        <FloatingNotification
          notifications={notifications}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* 2. The main layout div remains, but no longer contains the floating notifications. */}
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors overflow-hidden">
        {!isFullscreen && (
          <Sidebar
            currentPage={activePageLabel}
            collapsed={isSidebarCollapsed}
            setCollapsed={setIsSidebarCollapsed}
            showInternalNotifications={!showFloatingNotifications}
            notifications={notifications}
            onDismissNotification={handleDismissNotification}
          />
        )}

        <main className="flex-1 flex flex-col relative">
          <header
            className={`bg-white dark:bg-gray-800 shrink-0 flex items-center gap-4 ${
              isFullscreen
                ? "p-4 border-b dark:border-gray-700"
                : "p-4 shadow-sm"
            }`}
          >
            <h1
              className={`text-2xl shrink-0 ${
                isFullscreen
                  ? "font-extrabold text-gray-900 dark:text-white tracking-wide"
                  : "font-semibold text-gray-900 dark:text-white"
              }`}
            >
              {isFullscreen ? "SPIDERWEB" : activePageLabel}
            </h1>

            {/* --- MODIFICATION 5: Conditionally render the tabs --- */}
            {pageHasTabs && (
              <div className="flex-1 flex justify-center">
                <Tabs
                  value={activeTabValue}
                  onValueChange={handleTabChangeForNavigation}
                  className="w-full md:w-[750px] lg:w-[800px]"
                >
                  <TabsList className="grid-cols-5">
                    <TabsTrigger
                      value="favorites"
                      className="flex items-center gap-1.5"
                    >
                      <Star className="h-4 w-4 text-yellow-500" /> Favorites
                    </TabsTrigger>
                    <TabsTrigger value="all_interfaces">
                      All Interfaces
                    </TabsTrigger>
                    <TabsTrigger value="l_network">L-chart</TabsTrigger>
                    <TabsTrigger value="p_network">P-chart</TabsTrigger>
                    <TabsTrigger value="site">Site</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {!pageHasTabs && <div className="flex-1"></div>}

            {/* Wrapper for right-side action buttons */}
            <div className="flex items-center gap-4">
              {" "}
              {/* Removed ml-auto */}
              <RealtimeStatusIndicator />
              {renderFullscreenToggleButton()}
              <button
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* --- MODIFICATION 6: Adjust padding on the main content area --- */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto ${
              theme === "dark"
                ? "dark-scrollbar dark-scrollbar-firefox"
                : "light-scrollbar light-scrollbar-firefox"
            } ${!isFullscreen && "p-4 md:p-6"}`} // The padding is now correctly tied ONLY to the fullscreen state
          >
            <Routes>
              <Route path="/admin" element={<AdminPanelPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/notifications" element={<AlertsPage />} />
              <Route
                path="/help"
                element={
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    Help Page Content
                  </div>
                }
              />
              <Route
                path="/settings"
                element={
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    Settings Page Content
                  </div>
                }
              />
              <Route
                path="/*"
                element={
                  <DashboardPage
                    isAppFullscreen={isFullscreen}
                    activeTabValue={activeTabValue}
                    theme={theme}
                    popupAnchorCoords={dashboardLogic.popupAnchorCoords}
                    chartKeySuffix={dashboardLogic.chartKeySuffix}
                  />
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

export default AppLayout;
