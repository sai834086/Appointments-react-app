import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faBell,
  faUser,
  faGear,
  faCircleQuestion,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import DashboardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./UserLayout.module.css";
import { getUnreadCount } from "../../api/userService";

const SIDEBAR_ITEMS = [
  { label: "Home",          icon: faHome,           path: "/dashboard" },
  { label: "Bookings",      icon: faCalendarAlt,    path: "/bookings" },
  { label: "Notifications", icon: faBell,           path: "/notifications" },
  { label: "Profile",       icon: faUser,           path: "/profile" },
  { label: "Settings",      icon: faGear,           path: "/settings" },
  { label: "Help",          icon: faCircleQuestion, path: "/help" },
  { label: "Contact Us",    icon: faEnvelope,       path: "/contact" },
];

const BOTTOM_NAV = [
  { label: "Home",          icon: faHome,        path: "/dashboard" },
  { label: "Bookings",      icon: faCalendarAlt, path: "/bookings" },
  { label: "Notifications", icon: faBell,        path: "/notifications" },
  { label: "Account",       icon: faUser,        path: "/account" },
];

// Paths that belong to the "Account" tab
const ACCOUNT_PATHS = ["/account", "/profile", "/settings", "/help", "/contact"];

function getSavedAddress() {
  // sessionStorage so the address survives a refresh within the tab but is
  // never persisted to disk. localStorage is reserved for the JWT token only.
  try {
    const raw = sessionStorage.getItem("userAddress");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function UserLayout({
  children,
  searchValue = "",
  onSearchChange,
  userAddress: addressProp,
  onLocationClick,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [savedAddress]  = useState(getSavedAddress);
  const userAddress     = addressProp ?? savedAddress;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount();
        if (!cancelled) setUnreadCount(res.data?.data?.unreadCount ?? 0);
      } catch { /* silent */ }
    };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (location.pathname === "/notifications") setUnreadCount(0);
  }, [location.pathname]);

  return (
    <div className={styles.layoutContainer}>
      {/* ── Sticky header ── */}
      <div className={styles.headerContainer}>
        <DashboardHeader
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          userAddress={userAddress}
          onLocationClick={onLocationClick}
        />
      </div>

      <div className={styles.layoutBody}>
        {/* ── Left Sidebar (desktop) ── */}
        <aside className={styles.sidebar}>
          {SIDEBAR_ITEMS.map(({ label, icon, path }) => (
            <button
              key={label}
              className={`${styles.sidebarItem} ${location.pathname === path ? styles.sidebarActive : ""}`}
              onClick={() => navigate(path)}
            >
              <span className={styles.sidebarIconWrap}>
                <FontAwesomeIcon icon={icon} className={styles.sidebarIcon} />
                {label === "Notifications" && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ── */}
      <nav className={styles.bottomNav}>
        {BOTTOM_NAV.map(({ label, icon, path }) => {
          const isActive = label === "Account"
            ? ACCOUNT_PATHS.includes(location.pathname)
            : location.pathname === path;

          return (
            <button
              key={label}
              className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ""}`}
              onClick={() => navigate(path)}
            >
              <span className={styles.bottomNavIconWrap}>
                <FontAwesomeIcon icon={icon} className={styles.bottomNavIcon} />
                {label === "Notifications" && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </span>
              <span className={styles.bottomNavLabel}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
