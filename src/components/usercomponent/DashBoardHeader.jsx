import styles from "./DashBoardHeader.module.css";
import {
  faMobileAlt,
  faSearch,
  faTimes,
  faMapMarkerAlt,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

export default function DashBoardHeader({
  searchValue = "",
  onSearchChange,
  userAddress,
  onLocationClick,
}) {
  const navigate = useNavigate();

  const locationText = userAddress
    ? [userAddress.buildingNo, userAddress.street, userAddress.city, userAddress.state]
        .filter(Boolean)
        .join(", ")
    : "Add location";

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>

        {/* ── Logo ── */}
        <div className={styles.logo} onClick={() => navigate("/dashboard")}>
          <span className={styles.logoIcon}>
            <FontAwesomeIcon icon={faMobileAlt} />
          </span>
          <span className={styles.logoText}>Appointys</span>
        </div>

        {/* ── Search bar ── */}
        <div className={styles.searchCenter}>
          <div className={styles.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIconLeft} />
            <input
              type="text"
              placeholder='Search "Business Name"'
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={styles.searchInput}
              autoComplete="off"
              spellCheck="false"
            />
            {searchValue && (
              <button
                className={styles.clearBtn}
                onClick={() => onSearchChange?.("")}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <button className={styles.locationBtn} onClick={onLocationClick}>
            <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.locationPin} />
            <span className={styles.locationText}>{locationText}</span>
            <FontAwesomeIcon icon={faChevronDown} className={styles.chevron} />
          </button>
        </div>

      </div>
    </header>
  );
}
