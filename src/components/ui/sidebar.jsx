import React from "react";
import { Link } from "react-router-dom";
import {
  MdDashboard,
  MdAdminPanelSettings,
  MdSearch,
  MdNotifications,
  MdHelp,
  MdSettings,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { DarkModeToggle } from "../ui/dark-mode-toggle";

// Map labels to URL paths for clean routing
const navLinks = {
  Dashboard: "/",
  Search: "/search",
  "Admin Panel": "/admin",
  Notifications: "/notifications",
  Help: "/help",
  Settings: "/settings",
};

// NavItem component remains unchanged
function NavItem({ label, icon, collapsed, active }) {
  return (
    <Link
      to={navLinks[label] || "/"}
      className={`flex items-center gap-3 text-sm px-3 py-2 rounded-md w-full transition
    ${
      active
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white font-semibold"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

// Main Sidebar component with the updated title style
export function Sidebar({ currentPage, collapsed, setCollapsed }) {
  const navItems = [
    { label: "Dashboard", icon: <MdDashboard size={20} /> },
    { label: "Search", icon: <MdSearch size={20} /> },
    { label: "Admin Panel", icon: <MdAdminPanelSettings size={20} /> },
    { label: "Notifications", icon: <MdNotifications size={20} /> },
  ];

  const footerItems = [
    { label: "Help", icon: <MdHelp size={20} /> },
    { label: "Settings", icon: <MdSettings size={20} /> },
  ];

  return (
    <div
      className={`h-screen ${
        collapsed ? "w-16" : "w-60"
      } bg-white dark:bg-gray-900 border-r dark:border-gray-700 shadow-sm flex flex-col transition-all duration-300`}
    >
      {/* --- HEADER SECTION (THIS IS WHERE THE CHANGE IS) --- */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 shrink-0">
        {!collapsed && (
          // THIS IS THE CORRECTED LINE
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-wide">
            SPIDERWEB
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {collapsed ? (
            <MdChevronRight size={24} />
          ) : (
            <MdChevronLeft size={24} />
          )}
        </button>
      </div>

      {/* Main Navigation (unchanged) */}
      <nav className="flex-1 flex flex-col space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            active={currentPage === item.label}
          />
        ))}
      </nav>

      {/* Footer Navigation (unchanged) */}
      <div className="px-2 py-2 border-t dark:border-gray-700 shrink-0">
        {footerItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            active={currentPage === item.label}
          />
        ))}
        <div className="mt-2">
          <DarkModeToggle collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}
