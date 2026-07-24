import React from "react";
import styles from "./PartnersList.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faStar,
  faMapMarkerAlt,
  faCheckCircle,
  faBuilding,
  faConciergeBell,
} from "@fortawesome/free-solid-svg-icons";

// ── Business type config ──────────────────────────────────────────────────────
const TYPE_CONFIG = {
  hospital: {
    bg: "#fef2f2",
    solidBg: "#fee2e2",
    emoji: "🏥",
    accent: "#dc2626",
  },
  "beauty & spa": {
    bg: "#fdf4ff",
    solidBg: "#fae8ff",
    emoji: "💆",
    accent: "#a21caf",
  },
  restaurant: {
    bg: "#fffbeb",
    solidBg: "#fef3c7",
    emoji: "🍽️",
    accent: "#d97706",
  },
  clinic: { bg: "#eff6ff", solidBg: "#dbeafe", emoji: "🩺", accent: "#2563eb" },
  gym: { bg: "#f0fdf4", solidBg: "#dcfce7", emoji: "💪", accent: "#16a34a" },
};

function getTypeConfig(type) {
  const key = type?.toLowerCase();
  return (
    Object.entries(TYPE_CONFIG).find(([k]) => key?.includes(k))?.[1] || {
      bg: "#f5f3ff",
      solidBg: "#ede9fe",
      emoji: "🏢",
      accent: "#7c3aed",
    }
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardBody}>
        <div className={`${styles.piBox} ${styles.skeletonBox}`} />
        <div className={styles.contentArea}>
          <div className={`${styles.skeletonLine} ${styles.skeletonWide}`} />
          <div className={styles.statsRow}>
            <div className={`${styles.skeletonLine} ${styles.skeletonStat}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonStat}`} />
          </div>
          <div className={`${styles.skeletonLine} ${styles.skeletonNarrow}`} />
        </div>
      </div>
      <div className={styles.cardFooter}>
        <div className={`${styles.skeletonLine} ${styles.skeletonMid}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonStat}`} />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ searchQuery, selectedCategory }) {
  const isFiltered =
    searchQuery || (selectedCategory && selectedCategory !== "All");
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <FontAwesomeIcon icon={faSearch} />
      </div>
      <p className={styles.emptyTitle}>
        {isFiltered ? "No matches found" : "No results near you"}
      </p>
      <p className={styles.emptySubtitle}>
        {isFiltered
          ? "Try a different search or category."
          : "Check back later or try a different location."}
      </p>
    </div>
  );
}

// ── Partner card ──────────────────────────────────────────────────────────────
function PartnerCard({ partner, onClick }) {
  const cfg = getTypeConfig(partner.type);
  const propertyCount = Number(partner.propertyCount ?? 1);
  const serviceCount = Number(partner.serviceCount ?? 1);
  const address = [partner.buildingNo, partner.street, partner.city, partner.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`View ${partner.name}`}
    >
      <div className={styles.cardBody}>
        {/* ── Left: emoji panel ── */}
        <div
          className={styles.piBox}
          style={{
            background: `linear-gradient(160deg, ${cfg.bg}, ${cfg.solidBg})`,
          }}
        >
          <span className={styles.bannerEmoji}>{cfg.emoji}</span>
        </div>

        {/* ── Right: content ── */}
        <div className={styles.contentArea}>
          {/* Name */}
          <p className={styles.partnerName} title={partner.name}>
            {partner.name || "—"}
          </p>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <span className={styles.statChip}>
              <FontAwesomeIcon icon={faBuilding} className={styles.statIcon} />
              {propertyCount} {propertyCount === 1 ? "Property" : "Properties"}
            </span>
            <span className={styles.statChip}>
              <FontAwesomeIcon
                icon={faConciergeBell}
                className={styles.statIcon}
              />
              {serviceCount} {serviceCount === 1 ? "Service" : "Services"}
            </span>
          </div>

          {/* Booking charge */}
          <p className={styles.chargeRow}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              className={styles.checkIcon}
            />
            <span>
              Booking Charges: <strong>Free</strong>
            </span>
          </p>
        </div>
      </div>

      {/* ── Footer: address + rating ── */}
      <div className={styles.cardFooter}>
        <p className={styles.addressRow} title={address}>
          <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.pinIcon} />
          <span>{address || "—"}</span>
        </p>
        <span className={styles.ratingBadge}>
          <FontAwesomeIcon icon={faStar} className={styles.starIcon} />
          4.5
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const PartnersList = ({
  partners,
  isLoading,
  totalCount,
  searchQuery,
  selectedCategory,
  userAddress,
}) => {
  const navigate = useNavigate();

  const handlePartnerClicked = (partner) => {
    navigate("/services", { state: { partnerId: partner.id } });
  };

  const headingText = () => {
    if (isLoading) return null;
    if (partners.length === 0) return null;
    if (searchQuery || (selectedCategory && selectedCategory !== "All")) {
      return `${partners.length} result${partners.length !== 1 ? "s" : ""} found`;
    }
    if (userAddress?.city && userAddress?.state) {
      return `Business available in ${userAddress.city}, ${userAddress.state}`;
    }
    return "Business available";
  };

  return (
    <div className={styles.container}>
      {!isLoading && partners.length > 0 && (
        <h2 className={styles.sectionTitle}>{headingText()}</h2>
      )}

      {isLoading ? (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />
      ) : (
        <div className={styles.grid}>
          {partners.map((partner, idx) => (
            <PartnerCard
              key={partner.id || idx}
              partner={partner}
              onClick={() => handlePartnerClicked(partner)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnersList;
