import styles from "./DashBoardHeader.module.css";
import {
  faMobileAlt,
  faBell,
  faHome,
  faCalendarAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

export default function DashBoardHeader() {
  const [activeNavItem, setActiveNavItem] = useState("Home");
  const navigate = useNavigate();

  const handleNavClick = (navItem) => {
    setActiveNavItem(navItem);
    console.log(`Navigated to: ${navItem}`);
    // Add navigation logic here
    if (navItem === "Home") {
      navigate("/dashboard");
    }
    // Add other navigation logic as needed
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
              <button
                className={`${styles.navItem} ${
                  activeNavItem === "Account" ? styles.active : ""
                }`}
                onClick={() => handleNavClick("Account")}
              >
                Account
              </button>
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
