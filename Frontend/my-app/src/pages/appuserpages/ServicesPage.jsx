import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAllServicesByPartner,
  getEmployeesForService,
} from "../../api/userService";
import styles from "./ServicesPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faClock,
  faUsers,
  faDollarSign,
  faMapMarkerAlt,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faArrowRight,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

function formatFee(fee) {
  if (fee == null) return null;
  return `$${parseFloat(fee).toFixed(2)}`;
}

/* Deterministic accent colour from service name */
const ACCENT_COLORS = [
  ["#6366f1", "#818cf8"], // indigo
  ["#0066cc", "#3b82f6"], // blue
  ["#0891b2", "#22d3ee"], // cyan
  ["#059669", "#34d399"], // emerald
  ["#d97706", "#fbbf24"], // amber
  ["#dc2626", "#f87171"], // red
  ["#7c3aed", "#a78bfa"], // violet
  ["#db2777", "#f472b6"], // pink
];
function accentFor(name = "") {
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    ACCENT_COLORS.length;
  return ACCENT_COLORS[idx];
}

const ServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const partnerId = location.state?.partnerId;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [modalDesc, setModalDesc] = useState(null); // { name, text }
  const [loadingServiceId, setLoadingServiceId] = useState(null);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    if (!partnerId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllServicesByPartner(partnerId);
        const data = res.data.data["propertyWithServices"] || [];
        const arr = [];
        if (Array.isArray(data)) {
          data.forEach((prop) => {
            (prop.servicesResponses || []).forEach((svc) => {
              arr.push({
                id: svc.serviceId,
                serviceId: svc.serviceId,
                name: svc.serviceName,
                eachServiceTimeInMinus: svc.eachServiceTimeInMinus,
                serviceFee: svc.serviceFee,
                description: svc.description,
                employeeCount: svc.employeeCount ?? 0,
                propertyId: prop.propertyId,
                propertyName: prop.propertyName,
                buildingNo: prop.buildingNo,
                street: prop.street,
                city: prop.city,
                state: prop.state,
                country: prop.country,
              });
            });
          });
        }
        // Guard: only show services that have at least one employee assigned
        setServices(arr.filter((s) => s.employeeCount > 0));
      } catch (err) {
        setError("Failed to load services. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerId]);

  const handleSelectService = async (svc) => {
    if (svc.employeeCount === 0) return;
    setLoadingServiceId(svc.serviceId);
    try {
      const res = await getEmployeesForService(svc.propertyId, svc.serviceId);
      const employees = res.data.data.allEmployees || res.data.data || [];
      navigate("/employees", { state: { service: svc, employees } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServiceId(null);
    }
  };

  const uniqueProperties = useMemo(
    () => [...new Set(services.map((s) => s.propertyName))].sort(),
    [services],
  );
  const filteredServices = useMemo(
    () =>
      propertyFilter
        ? services.filter((s) => s.propertyName === propertyFilter)
        : services,
    [services, propertyFilter],
  );
  const servicesByProperty = useMemo(() => {
    const g = {};
    filteredServices.forEach((s) => {
      if (!g[s.propertyName]) g[s.propertyName] = [];
      g[s.propertyName].push(s);
    });
    return g;
  }, [filteredServices]);

  useEffect(() => {
    const h = (e) => {
      if (
        showFilterMenu &&
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target)
      )
        setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showFilterMenu]);

  if (!partnerId) {
    return (
        <div className={styles.pageWrapper}>
          <p className={styles.errorMsg}>No partner selected.</p>
        </div>
          );
  }

  return (
    <>
    <div className={styles.pageWrapper}>
        {/* Top bar */}
        <div className={styles.contentHeader}>
          <div className={styles.titleGroup}>
            <button
              className={styles.backBtn}
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h1 className={styles.title}>Services</h1>
          </div>

          <div className={styles.filterMenuWrapper} ref={filterMenuRef}>
            <button
              className={`${styles.filterToggleBtn} ${propertyFilter ? styles.filterActive : ""}`}
              onClick={() => setShowFilterMenu((p) => !p)}
              aria-label="Filter"
            >
              <FontAwesomeIcon icon={faFilter} />
              <span className={styles.filterToggleText}>
                {propertyFilter || "Filter"}
              </span>
              <FontAwesomeIcon
                icon={showFilterMenu ? faChevronUp : faChevronDown}
                className={styles.filterChevron}
              />
            </button>
            {showFilterMenu && (
              <div className={styles.filterDropdown}>
                <h3 className={styles.filterTitle}>Filter by property</h3>
                <div className={styles.filterOptions}>
                  <button
                    onClick={() => { setPropertyFilter(""); setShowFilterMenu(false); }}
                    className={`${styles.filterBtn} ${propertyFilter === "" ? styles.active : ""}`}
                  >
                    <span>All properties</span>
                    <span className={styles.filterBadge}>{services.length}</span>
                  </button>
                  {uniqueProperties.map((prop) => (
                    <button
                      key={prop}
                      onClick={() => { setPropertyFilter(prop); setShowFilterMenu(false); }}
                      className={`${styles.filterBtn} ${propertyFilter === prop ? styles.active : ""}`}
                    >
                      <span>{prop}</span>
                      <span className={styles.filterBadge}>
                        {services.filter((s) => s.propertyName === prop).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* States */}
        {loading && <div className={styles.loading}>Loading servicesâ€¦</div>}
        {error && <div className={styles.errorBox}>{error}</div>}
        {!loading && !error && services.length === 0 && (
          <div className={styles.empty}>No services available</div>
        )}

        {/* Services grouped by property */}
        {!loading && !error && services.length > 0 && (
          <div className={styles.servicesList}>
            {Object.entries(servicesByProperty).map(([propName, propServices]) => {
              const first = propServices[0];
              const addr = [first?.buildingNo, first?.street, first?.city, first?.state]
                .filter(Boolean)
                .join(", ");
              return (
          <section key={propName} className={styles.propertyGroup}>
                  {/* Property header */}
                  <div className={styles.propertyHeader}>
                    <div className={styles.propertyInfo}>
                      <h2 className={styles.propertyTitle}>{propName}</h2>
                      {addr && (
                        <p className={styles.address}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          {addr}
                        </p>
                      )}
                    </div>
                    <span className={styles.serviceCountBadge}>
                      {propServices.length}{" "}
                      {propServices.length === 1 ? "service" : "services"}
                    </span>
                  </div>

                  {/* Cards grid */}
                  <div className={styles.servicesGrid}>
                    {propServices.map((svc, idx) => {
                      const [color1, color2] = accentFor(svc.name);
                      const initial = (svc.name || "S").charAt(0).toUpperCase();
                      const isLoading = loadingServiceId === svc.serviceId;
                      const hasLongDesc = svc.description && svc.description.length > 40;

                      return (
                  <div key={svc.id || idx} className={styles.serviceCard}>
                          {/* Card header */}
                          <div className={styles.cardHeader}>
                            <div className={styles.serviceAvatar}>
                              {initial}
                            </div>
                            <div className={styles.headerMeta}>
                              <h3 className={styles.serviceName}>{svc.name}</h3>
                            </div>
                          </div>

                          <div className={styles.cardBody}>

                            {/* Stat chips */}
                            <div className={styles.statChips}>
                              {svc.eachServiceTimeInMinus > 0 && (
                                <span className={styles.chip}>
                                  <FontAwesomeIcon icon={faClock} className={styles.chipIcon} />
                                  {svc.eachServiceTimeInMinus} min
                                </span>
                              )}
                              {svc.serviceFee != null && (
                                <span className={`${styles.chip} ${styles.chipFee}`}>
                                  <FontAwesomeIcon icon={faDollarSign} className={styles.chipIcon} />
                                  {formatFee(svc.serviceFee)}
                                </span>
                              )}
                              <span className={`${styles.chip} ${svc.employeeCount > 0 ? styles.chipStaff : styles.chipNone}`}>
                                <FontAwesomeIcon icon={faUsers} className={styles.chipIcon} />
                                {svc.employeeCount > 0 ? `${svc.employeeCount} staff` : "No staff"}
                              </span>
                            </div>

                            {/* Description */}
                            {svc.description ? (
                              <div className={styles.descBlock}>
                                <p className={styles.descText}>{svc.description}</p>
                                {hasLongDesc && (
                                  <button
                                    className={styles.descToggle}
                                    onClick={() => setModalDesc({ name: svc.name, text: svc.description })}
                                  >
                                    Read more
                                    <FontAwesomeIcon icon={faChevronRight} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className={styles.descEmpty}>No description provided</p>
                            )}
                          </div>

                          {/* Card footer â€” Book Now */}
                          <div className={styles.cardFooter}>
                            <button
                              className={styles.bookBtn}
                              onClick={() => handleSelectService(svc)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className={styles.bookBtnSpinner} />
                              ) : (
                                "Select"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Description modal */}
      {modalDesc && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setModalDesc(null); }}
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{modalDesc.name}</h2>
              <button className={styles.modalClose} onClick={() => setModalDesc(null)} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{modalDesc.text}</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalButton} onClick={() => setModalDesc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServicesPage;



