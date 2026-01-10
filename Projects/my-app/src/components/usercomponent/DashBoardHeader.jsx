import styles from "./DashBoardHeader.module.css";
import {
  faMobileAlt,
  faBell,
  faHome,
  faCalendarAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate, useLocation } from "react-router-dom";
import AccountDropdown from "./AccountDropdown";

export default function DashBoardHeader() {
  const [activeNavItem, setActiveNavItem] = useState("Home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const accountButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Update active nav item based on current route
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      setActiveNavItem("Home");
    } else if (location.pathname === "/bookings") {
      setActiveNavItem("Bookings");
    } else if (location.pathname === "/account") {
      setActiveNavItem("Account");
    }
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 768);
      // Close dropdown if resizing to mobile
      if (width < 768) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (navItem) => {
    setActiveNavItem(navItem);
    if (navItem === "Home") {
      navigate("/dashboard");
    } else if (navItem === "Bookings") {
      navigate("/bookings");
    } else if (navItem === "Account") {
      if (isMobile) {
        // On mobile, navigate to full account page
        navigate("/account");
      } else {
        // On desktop, toggle dropdown
        setIsDropdownOpen(!isDropdownOpen);
      }
    }
  };
  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <FontAwesomeIcon icon={faMobileAlt} />
            </span>
            Appointys
          </div>

          <div className={styles.headerRight}>
            {/* Desktop Navigation - Right Side */}
            <nav className={styles.desktopNav}>
              <button
                className={`${styles.navItem} ${
                  activeNavItem === "Home" ? styles.active : ""
                }`}
                onClick={() => handleNavClick("Home")}
              >
                Home
              </button>
              <button
                className={`${styles.navItem} ${
                  activeNavItem === "Bookings" ? styles.active : ""
                }`}
                onClick={() => handleNavClick("Bookings")}
              >
                Bookings
              </button>

              {/* Account Button with Dropdown */}
              <div
                className={styles.accountButtonContainer}
                ref={accountButtonRef}
              >
                <button
                  className={`${styles.navItem} ${
                    activeNavItem === "Account" || isDropdownOpen
                      ? styles.active
                      : ""
                  }`}
                  onClick={() => handleNavClick("Account")}
                >
                  Account
                </button>
                <AccountDropdown
                  isOpen={isDropdownOpen && !isMobile}
                  onClose={() => setIsDropdownOpen(false)}
                />
              </div>
            </nav>

            {/* Notifications Button - Top Right */}
            <button
              className={`${styles.notificationButton} ${
                activeNavItem === "Notifications" ? styles.active : ""
              }`}
              onClick={() => handleNavClick("Notifications")}
            >
              <span className={styles.notificationIcon}>
                <FontAwesomeIcon icon={faBell} />
              </span>
            </button>
          </div>
        </div>
      </header>
      {/* Mobile Bottom Navigation */}
      <nav className={styles.mobileNav}>
        <button
          className={`${styles.mobileNavItem} ${
            activeNavItem === "Home" ? styles.active : ""
          }`}
          onClick={() => handleNavClick("Home")}
        >
          <span className={styles.navIcon}>
            <FontAwesomeIcon icon={faHome} />
          </span>
          <span className={styles.navLabel}>Home</span>
        </button>
        <button
          className={`${styles.mobileNavItem} ${
            activeNavItem === "Bookings" ? styles.active : ""
          }`}
          onClick={() => handleNavClick("Bookings")}
        >
          <span className={styles.navIcon}>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </span>
          <span className={styles.navLabel}>Bookings</span>
        </button>
        <button
          className={`${styles.mobileNavItem} ${
            activeNavItem === "Account" ? styles.active : ""
          }`}
          onClick={() => handleNavClick("Account")}
        >
          <span className={styles.navIcon}>
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className={styles.navLabel}>Account</span>
        </button>
      </nav>
    </div>
  );
}
