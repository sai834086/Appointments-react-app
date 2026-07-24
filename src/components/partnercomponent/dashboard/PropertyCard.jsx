import { useState, useRef, useEffect } from "react";
import StatCircle from "./StatCircle";
import styles from "./PropertyCard.module.css";
import { MapPin, Settings, Pencil, Eye, Plus, Camera } from "lucide-react";

/**
 * PropertyCard — one property in the portfolio.
 *
 *   [ image ] | Property name ................. [status]
 *             | address
 *             | [Employees n ◯◯] [Services n] [Manager / Add]
 *             | [Edit Property]        [View Property]
 *
 * The image slot shows the property's uploaded photo when available; until
 * one is set it falls back to a deterministic gradient tile with the
 * property's initial (same property → same color). Users can upload a photo
 * via the "Upload photo" button. NOTE: this is frontend-only for now — the
 * selected image is previewed locally (object URL) and NOT yet sent to the
 * backend / S3. Wiring persistence is a follow-up once the bucket exists.
 *
 * Props:
 *   property  PropertyDetailsResponse-shaped object
 *   onView    (property) => void
 *   onEdit    (property) => void — deletion lives inside the Edit modal
 *   onManage  (property, mode: "add" | "edit") => void
 */

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
];

function getAvatar(property) {
  const name = property?.propertyName || property?.name || "Property";
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return {
    letter: name.charAt(0).toUpperCase() || "P",
    gradient: AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
  };
}

function buildAddressLine(property) {
  return [
    `${property.buildingNo || ""} ${property.street || ""}`.trim(),
    [property.city, property.state, property.zipCode].filter(Boolean).join(", "),
    property.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

function hasDedicatedManager(property) {
  const m = property?.manager;
  return Boolean(m && !m.isOwner && m.email);
}

export default function PropertyCard({ property, onView, onEdit, onManage }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Local-only image preview. Seeds from any image field the backend might
  // already send (imageUrl / imageURL / photoUrl); otherwise null → fallback.
  const [imageUrl, setImageUrl] = useState(
    property?.imageUrl || property?.imageURL || property?.photoUrl || null,
  );
  // Track the object URL we created so we can revoke it and avoid leaks.
  const objectUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    // Revoke the previous preview URL before replacing it.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);

    // TODO(backend): once the S3 bucket exists, upload `file` here and store
    // the returned URL on the property instead of the local object URL.

    // Allow re-selecting the same file again later.
    e.target.value = "";
  };

  const avatar = getAvatar(property);
  const addressLine = buildAddressLine(property);
  const inactive = property.status === "INACTIVE";

  const totalEmployees = property.totalEmployees ?? 0;
  // Older backend builds don't send activeEmployees — null hides the circles.
  const activeEmployees = property.activeEmployees ?? null;
  const inactiveEmployees =
    activeEmployees == null ? null : Math.max(0, totalEmployees - activeEmployees);

  // Service status is derived: ACTIVE = offered by at least one employee.
  const totalServices = property.totalServices ?? 0;
  const activeServices = property.activeServices ?? null;
  const inactiveServices =
    activeServices == null ? null : Math.max(0, totalServices - activeServices);

  const managed = hasDedicatedManager(property);
  const managerName = managed
    ? `${property.manager.firstName ?? ""} ${property.manager.lastName ?? ""}`.trim() ||
      property.manager.email
    : null;
  const managerInitials = managed
    ? `${(property.manager.firstName || " ")[0]}${(property.manager.lastName || " ")[0]}`
        .trim()
        .toUpperCase() || "M"
    : null;

  const name = property.propertyName || property.name;

  return (
    <article className={styles.card} aria-label={name}>
      {/* ---------- Image tile (uploaded photo, or gradient + initial) ---------- */}
      <div
        className={styles.imageTile}
        style={imageUrl ? undefined : { background: avatar.gradient }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={`${name} property`} className={styles.image} />
        ) : (
          <span className={styles.imageLetter} aria-hidden="true">
            {avatar.letter}
          </span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          aria-hidden="true"
          tabIndex={-1}
        />

        <button
          type="button"
          className={styles.uploadButton}
          onClick={handlePickImage}
        >
          <Camera size={14} strokeWidth={2.25} aria-hidden="true" />
          {imageUrl ? "Change photo" : "Upload photo"}
        </button>
      </div>

      <div className={styles.body}>
        {/* ---------- Name + status ---------- */}
        <header className={styles.headRow}>
          <div className={styles.titleWrap}>
            <h3 className={styles.name} title={name}>
              {name}
            </h3>
            <p className={styles.address}>
              <MapPin size={13} strokeWidth={2.25} aria-hidden="true" />
              <span>{addressLine || "Address not set"}</span>
            </p>
          </div>

          <div className={styles.headActions}>
            <span
              className={`${styles.statusPill} ${
                inactive ? styles.statusInactive : styles.statusActive
              }`}
            >
              <span className={styles.statusDot} aria-hidden="true" />
              {property.status || "Active"}
              {inactive && (
                <span className={styles.tooltipWrap}>
                  <button
                    type="button"
                    className={styles.infoButton}
                    onClick={() => setShowTooltip((s) => !s)}
                    aria-expanded={showTooltip}
                    aria-label="Why is this property inactive?"
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <span className={styles.tooltip} role="note">
                      To activate this property, add at least one employee or
                      ensure you have an active employee.
                      <button
                        type="button"
                        className={styles.tooltipClose}
                        onClick={() => setShowTooltip(false)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </span>
              )}
            </span>
          </div>
        </header>

        {/* ---------- Info boxes: Employees / Services / Manager ---------- */}
        <div className={styles.infoGrid}>
          <section className={styles.infoBox} aria-label="Employees">
            <header className={styles.infoBoxHeader}>
              <span className={styles.infoBoxLabel}>Employees</span>
              <span className={styles.infoBoxValue}>{totalEmployees}</span>
            </header>
            {activeEmployees != null ? (
              <div className={styles.circlePair}>
                <StatCircle size="sm" label="Active" value={activeEmployees} />
                <StatCircle size="sm" label="Inactive" value={inactiveEmployees} />
              </div>
            ) : (
              <p className={styles.infoBoxHint}>Across this property</p>
            )}
          </section>

          <section className={styles.infoBox} aria-label="Services">
            <header className={styles.infoBoxHeader}>
              <span className={styles.infoBoxLabel}>Services</span>
              <span className={styles.infoBoxValue}>{totalServices}</span>
            </header>
            {activeServices != null ? (
              <div className={styles.circlePair}>
                <StatCircle size="sm" label="Active" value={activeServices} />
                <StatCircle size="sm" label="Inactive" value={inactiveServices} />
              </div>
            ) : (
              <>
                <div className={styles.serviceIconWrap} aria-hidden="true">
                  <Settings size={22} strokeWidth={1.75} />
                </div>
                <p className={styles.infoBoxHint}>Offered at this property</p>
              </>
            )}
          </section>

          <section className={styles.infoBox} aria-label="Manager">
            <header className={styles.infoBoxHeader}>
              <span className={styles.infoBoxLabel}>Manager</span>
            </header>
            {managed ? (
              <button
                type="button"
                className={styles.managerChip}
                onClick={() => onManage(property, "edit")}
                title="Edit manager"
              >
                <span className={styles.managerAvatar} aria-hidden="true">
                  {managerInitials}
                </span>
                <span className={styles.managerName}>{managerName}</span>
                <Pencil size={12} strokeWidth={2.25} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className={styles.managerAddButton}
                onClick={() => onManage(property, "add")}
              >
                <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                Add
              </button>
            )}
          </section>
        </div>

        {/* ---------- Footer actions ---------- */}
        <footer className={styles.footerRow}>
          <button type="button" className={styles.editButton} onClick={() => onEdit(property)}>
            <Pencil size={14} strokeWidth={2.25} aria-hidden="true" />
            Edit Property
          </button>
          <button type="button" className={styles.viewButton} onClick={() => onView(property)}>
            <Eye size={15} strokeWidth={2.25} aria-hidden="true" />
            View Property
          </button>
        </footer>
      </div>
    </article>
  );
}

export { hasDedicatedManager };
