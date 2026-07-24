import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import Header from "../../components/partnercomponent/Header";
import ReceptionistModal from "../../components/partnercomponent/ReceptionistModal";
import {
  getPropertyReceptionists,
  removePropertyReceptionist,
} from "../../api/authService";
import { getPersonInitials, getPersonFullName } from "../../utils/personDisplay";
import StyleSheet from "./Employee.module.css";
import rcpStyles from "./PropertyDetails.module.css";

/**
 * ManageReceptionists
 * --------------------
 * Full-page "Manage Receptionists" screen, reached via its own route (same
 * pattern as Manage Employees / Manage Services) rather than an inline
 * section on the property page. A property can have any number of
 * receptionists — this page lists them all and handles add/edit/remove.
 */
export default function ManageReceptionists() {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, userType } = useContext(PartnerAuthContext) || {};
  const isManager = userType === "manager";
  const basePath = isManager ? "/partner/manager" : "/partner";
  const dashboardPath = `${basePath}/dashboard`;

  // Resolve propertyId without exposing it in the URL.
  // Priority: nav state -> persisted fallback (refresh-safe).
  const propertyId = useMemo(() => {
    const fromState = location.state?.propertyId;
    if (fromState != null && fromState !== "") {
      try {
        sessionStorage.setItem("currentPropertyId", String(fromState));
      } catch {
        // ignore storage failures
      }
      return fromState;
    }
    try {
      return sessionStorage.getItem("currentPropertyId");
    } catch {
      return null;
    }
  }, [location.state]);

  const propertyFromContext = useMemo(() => {
    if (!propertyId || !Array.isArray(properties)) return null;
    return (
      properties.find((p) => {
        const pid = p.propertyId || p.id;
        return String(pid) === String(propertyId);
      }) || null
    );
  }, [properties, propertyId]);

  const propertyDetails =
    location.state?.propertyDetails || propertyFromContext || null;
  const propertyName =
    propertyDetails?.propertyName || propertyDetails?.name || "Property";
  const fullAddress = [
    [propertyDetails?.buildingNo, propertyDetails?.street]
      .filter(Boolean)
      .join(" "),
    [propertyDetails?.city, propertyDetails?.state, propertyDetails?.zipCode]
      .filter(Boolean)
      .join(", "),
    propertyDetails?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [activeReceptionist, setActiveReceptionist] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchReceptionists = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getPropertyReceptionists(propertyId);
      const list = response?.data?.data?.receptionists || [];
      setReceptionists(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to fetch receptionists",
      );
      setReceptionists([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  // Close the kebab menu whenever the user clicks elsewhere.
  useEffect(() => {
    if (openMenuId == null) return undefined;
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuId]);

  const handleBackToProperty = () => {
    if (isManager) {
      navigate(dashboardPath);
      return;
    }
    navigate(`${basePath}/property`, {
      state: { propertyId, propertyDetails },
    });
  };

  const handleOpenModal = (mode, targetReceptionist = null) => {
    setError(null);
    setModalMode(mode);
    setActiveReceptionist(targetReceptionist);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaved = async () => {
    setIsModalOpen(false);
    setActiveReceptionist(null);
    await fetchReceptionists();
  };

  const handleConfirmDelete = async () => {
    if (!propertyId || pendingDeleteId == null) return;
    setIsDeleting(true);
    setError(null);
    try {
      await removePropertyReceptionist(propertyId, pendingDeleteId);
      setReceptionists((prev) =>
        prev.filter((r) => r.userId !== pendingDeleteId),
      );
      setPendingDeleteId(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to remove receptionist. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = getPersonInitials;
  const getFullName = getPersonFullName;

  const pendingDeleteReceptionist = receptionists.find(
    (r) => r.userId === pendingDeleteId,
  );

  const hasReceptionists = receptionists.length > 0;

  if (!propertyId) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.EmptyState}>
            <div className={StyleSheet.EmptyIcon}>🏢</div>
            <h2>No property selected</h2>
            <p>Select a property from the dashboard to manage its receptionists.</p>
            <button
              type="button"
              className={StyleSheet.PrimaryAction}
              onClick={() => navigate(dashboardPath)}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>

      <div className={StyleSheet.BodyContainer}>
        <div className={StyleSheet.TopBar}>
          <button
            type="button"
            className={StyleSheet.BackLink}
            onClick={handleBackToProperty}
          >
            <span aria-hidden="true">←</span> Back to Property
          </button>
        </div>

        <section className={StyleSheet.HeroCard}>
          <div className={StyleSheet.HeroHeader}>
            <div className={StyleSheet.HeroHeading}>
              <h1 className={StyleSheet.PageTitle}>Receptionists</h1>
              <p className={StyleSheet.SubLine}>
                <span className={StyleSheet.SubAccent}>{propertyName}</span>
                {fullAddress && (
                  <>
                    <span className={StyleSheet.SubDot} aria-hidden="true">
                      •
                    </span>
                    <span className={StyleSheet.SubText}>{fullAddress}</span>
                  </>
                )}
              </p>
            </div>
            {hasReceptionists && (
              <button
                type="button"
                className={rcpStyles.AddReceptionistButton}
                onClick={() => handleOpenModal("add")}
              >
                + Add Receptionist
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className={rcpStyles.ErrorBanner} role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className={StyleSheet.EmptyState}>
            <p>Loading receptionists…</p>
          </div>
        ) : hasReceptionists ? (
          <div className={rcpStyles.ReceptionistList}>
            {receptionists.map((r) => (
              <div key={r.userId} className={rcpStyles.ReceptionistCard}>
                <div className={rcpStyles.ReceptionistAvatar}>
                  {getInitials(r)}
                </div>
                <div className={rcpStyles.ReceptionistBody}>
                  <div className={rcpStyles.ReceptionistNameRow}>
                    <h3 className={rcpStyles.ReceptionistName}>
                      {getFullName(r) || "Receptionist"}
                    </h3>
                    <span className={rcpStyles.ReceptionistBadge}>
                      Read-only
                    </span>
                  </div>
                  <div className={rcpStyles.ReceptionistContactGrid}>
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className={rcpStyles.ReceptionistContactItem}
                      >
                        <span className={rcpStyles.ReceptionistContactIcon}>
                          ✉
                        </span>
                        <span className={rcpStyles.ReceptionistContactText}>
                          <span className={rcpStyles.ReceptionistContactLabel}>
                            Email
                          </span>
                          <span className={rcpStyles.ReceptionistContactValue}>
                            {r.email}
                          </span>
                        </span>
                      </a>
                    )}
                    {r.phoneNumber && (
                      <a
                        href={`tel:${r.phoneNumber}`}
                        className={rcpStyles.ReceptionistContactItem}
                      >
                        <span className={rcpStyles.ReceptionistContactIcon}>
                          📞
                        </span>
                        <span className={rcpStyles.ReceptionistContactText}>
                          <span className={rcpStyles.ReceptionistContactLabel}>
                            Phone
                          </span>
                          <span className={rcpStyles.ReceptionistContactValue}>
                            {r.phoneNumber}
                          </span>
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                <div
                  className={rcpStyles.ReceptionistMenuWrapper}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={rcpStyles.ReceptionistMenuToggle}
                    aria-haspopup="true"
                    aria-expanded={openMenuId === r.userId}
                    aria-label="Receptionist options"
                    onClick={() =>
                      setOpenMenuId((open) => (open === r.userId ? null : r.userId))
                    }
                  >
                    ⋮
                  </button>
                  {openMenuId === r.userId && (
                    <div className={rcpStyles.ReceptionistMenuDropdown}>
                      <button
                        type="button"
                        className={rcpStyles.ReceptionistMenuItem}
                        onClick={() => handleOpenModal("edit", r)}
                      >
                        ✏️ Edit details
                      </button>
                      <button
                        type="button"
                        className={`${rcpStyles.ReceptionistMenuItem} ${rcpStyles.ReceptionistMenuItemDanger}`}
                        onClick={() => {
                          setOpenMenuId(null);
                          setPendingDeleteId(r.userId);
                        }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={rcpStyles.ReceptionistEmpty}>
            <div className={rcpStyles.ReceptionistEmptyIcon}>📋</div>
            <div className={rcpStyles.ReceptionistEmptyBody}>
              <h3 className={rcpStyles.ReceptionistEmptyTitle}>
                No receptionists assigned
              </h3>
              <p className={rcpStyles.ReceptionistEmptyText}>
                Add a receptionist to give front-desk staff a simple,
                read-only view of this property's appointments.
              </p>
            </div>
            <button
              type="button"
              className={rcpStyles.AddReceptionistButton}
              onClick={() => handleOpenModal("add")}
            >
              + Add Receptionist
            </button>
          </div>
        )}
      </div>

      <ReceptionistModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveReceptionist(null);
        }}
        mode={modalMode}
        propertyId={propertyId}
        propertyName={propertyName}
        receptionist={modalMode === "edit" ? activeReceptionist : null}
        onSaved={handleSaved}
      />

      {pendingDeleteId != null && (
        <div
          className={rcpStyles.ConfirmOverlay}
          role="presentation"
          onClick={() => !isDeleting && setPendingDeleteId(null)}
        >
          <div
            className={rcpStyles.ConfirmCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-receptionist-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={rcpStyles.ConfirmIcon} aria-hidden="true">
              ⚠
            </div>
            <h3
              id="confirm-delete-receptionist-title"
              className={rcpStyles.ConfirmTitle}
            >
              Remove receptionist?
            </h3>
            <p className={rcpStyles.ConfirmBody}>
              {getFullName(pendingDeleteReceptionist) || "This receptionist"}{" "}
              will be removed from <strong>{propertyName}</strong> and will no
              longer be able to sign in and view its appointments. Their
              account stays active — only their assignment to this property
              is cleared.
            </p>

            {error && <div className={rcpStyles.ConfirmError}>{error}</div>}

            <div className={rcpStyles.ConfirmActions}>
              <button
                type="button"
                className={rcpStyles.SecondaryAction}
                onClick={() => setPendingDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={rcpStyles.DangerAction}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
