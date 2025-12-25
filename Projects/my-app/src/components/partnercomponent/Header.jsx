import ProfileIcon from "./dashboardcomponents/ProfileIcon";
import HomeIcon from "./dashboardcomponents/HomeIcon";
import LogoutIcon from "./dashboardcomponents/LogoutIcon";
import styles from "./Header.module.css";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "../../pages/patneruserpages/context/PartnerAuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { logout, refreshProfile, refreshProperties } =
    useContext(PartnerAuthContext) || {};

  const handleLogout = () => {
    try {
      logout && logout();
    } catch {
      // Handle logout error silently
    }
    navigate("/partner/login");
  };
  return (
    <header className={styles.header}>
      <div className={styles.headerBackground}></div>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <div className={styles.logoContainer}>
            <span className={styles.logoIcon}>🏢</span>
            <div className={styles.logoText}>
              <span className={styles.brandName}>PropertyHub</span>
              <span className={styles.tagline}>Partner Portal</span>
            </div>
          </div>
        </div>
        <nav className={styles.navigation}>
          <div className={styles.navItems}>
            <Link
              to="/partner/dashboard"
              className={styles.navLink}
              aria-label="Dashboard"
              onClick={() => {
                if (refreshProfile) refreshProfile();
                if (refreshProperties) refreshProperties();
              }}
            >
              <HomeIcon />
              <span className={styles.navLabel}>Dashboard</span>
            </Link>
            <Link
              to="/partner/account"
              className={styles.navLink}
              aria-label="Profile"
            >
              <ProfileIcon />
              <span className={styles.navLabel}>Profile</span>
            </Link>
            <button
              type="button"
              className={styles.logoutButton}
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogoutIcon />
              <span className={styles.navLabel}>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
