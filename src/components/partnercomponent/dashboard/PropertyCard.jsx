import { useState, useRef, useEffect } from "react";
import styles from "./PropertyCard.module.css";
import { MapPin, Pencil, Eye, Plus, Camera, Store } from "lucide-react";

/**
 * PropertyCard — one property in the portfolio.
 *
 *   [ image ] | Property name ................. [status]
 *             | address
 *             | [Employees n ◯◯] [Services n] [Manager / Add]
 *             | [Edit Property]        [View Property]
 *
 * The image slot shows the property's uploaded photo when available; until
 * one is set it falls back to a neutral tinted tile with a storefront icon.
 * Users can upload a photo via the "Add photo" button. NOTE: this is frontend-only for now — the
 * selected image is previewed locally (object URL) and NOT yet sent to the
 * backend / S3. Wiring persistence is a follow-up once the bucket exists.
 *
 * Props:
 *   property  PropertyDetailsResponse-shaped object
 *   onView    (property) => void
 *   onEdit    (property) => void — deletion lives inside the Edit modal
 *   onManage  (property, mode: "add" | "edit") => void
 */

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
      {/* ---------- Image tile (uploaded photo, or tinted storefront icon) ---------- */}
      <div className={`${styles.imageTile} ${imageUrl ? "" : styles.imageTileEmpty}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={`${name} property`} className={styles.image} />
        ) : (
          <Store
            className={styles.imageIcon}
            size={52}
            strokeWidth={1.75}
            aria-hidden="true"
          />
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
          {imageUrl ? "Change photo" : "Add photo"}
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

        {/* ---------- Stats: Employees / Services, then Manager below ---------- */}
        <div className={styles.statsWrap}>
          <div className={styles.infoGrid}>
            <section className={styles.infoBox} aria-label="Employees">
              <p className={styles.infoBoxLabel}>Employees</p>
              <div className={styles.statRow}>
                <span className={styles.statValue}>{totalEmployees}</span>
                {activeEmployees != null ? (
                  <div className={styles.statBreakdown}>
                    <span className={styles.statActive}>{activeEmployees} active</span>
                    <span className={styles.statInactive}>{inactiveEmployees} inactive</span>
                  </div>
                ) : (
                  <div className={styles.statBreakdown}>
                    <span className={styles.statInactive}>Across this property</span>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.infoBox} aria-label="Services">
              <p className={styles.infoBoxLabel}>Services</p>
              <div className={styles.statRow}>
                <span className={styles.statValue}>{totalServices}</span>
                {activeServices != null ? (
                  <div className={styles.statBreakdown}>
                    <span className={styles.statActive}>{activeServices} active</span>
                    <span className={styles.statInactive}>{inactiveServices} inactive</span>
                  </div>
                ) : (
                  <div className={styles.statBreakdown}>
                    <span className={styles.statInactive}>Offered at this property</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className={styles.managerBox} aria-label="Manager">
            <p className={styles.infoBoxLabel}>Manager</p>
            {managed ? (
              <div className={styles.managerRow}>
                <span className={styles.managerAvatar} aria-hidden="true">
                  {managerInitials}
                </span>
                <div className={styles.managerText}>
                  <span className={styles.managerName}>{managerName}</span>
                  <span className={styles.managerRole}>Property manager</span>
                </div>
                <button
                  type="button"
                  className={styles.managerEditButton}
                  onClick={() => onManage(property, "edit")}
                  aria-label="Edit manager"
                  title="Edit manager"
                >
                  <Pencil size={14} strokeWidth={2.25} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className={styles.managerRow}>
                <div className={styles.managerText}>
                  <span className={styles.managerRole}>No manager assigned yet</span>
                </div>
                <button
                  type="button"
                  className={styles.managerAddButton}
                  onClick={() => onManage(property, "add")}
                >
                  <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                  Add manager
                </button>
              </div>
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
