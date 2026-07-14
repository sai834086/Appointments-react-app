import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import Header from "../../components/partnercomponent/Header";
import ManagerModal from "../../components/partnercomponent/ManagerModal";
import {
  getEmployees,
  getPropertyServices,
  removePropertyManager,
  getPropertyReceptionists,
} from "../../api/authService";
import { getPersonInitials, getPersonFullName } from "../../utils/personDisplay";
import StyleSheet from "./PropertyDetails.module.css";

export default function PropertyDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, refreshProperties, userType } =
    useContext(PartnerAuthContext) || {};
  const basePath = userType === "manager" ? "/partner/manager" : "/partner";
  const dashboardPath = `${basePath}/dashboard`;

  // Resolve the selected propertyId without putting it in the URL.
  // Priority: nav state -> persisted fallback (survives refresh).
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
      const stored = sessionStorage.getItem("currentPropertyId");
      return stored || null;
    } catch {
      return null;
    }
  }, [location.state?.propertyId]);

  const propertyFromContext = useMemo(() => {
    if (!propertyId || !Array.isArray(properties)) return null;
    return (
      properties.find((p) => {
        const pid = p.propertyId || p.id;
        return (
          String(pid) === String(propertyId) || pid === parseInt(propertyId, 10)
        );
      }) || null
    );
  }, [properties, propertyId]);

  const property =
    location.state?.propertyDetails || propertyFromContext || null;

  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manager modal + delete confirmation state.
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerModalMode, setManagerModalMode] = useState("add");
  const [isConfirmingManagerDelete, setIsConfirmingManagerDelete] =
    useState(false);
  const [isDeletingManager, setIsDeletingManager] = useState(false);
  const [managerError, setManagerError] = useState(null);
  const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);

  // Receptionists — read-only preview here; full add/edit/remove happens on
  // the dedicated "Manage Receptionists" page (handleViewReceptionists).
  const [receptionists, setReceptionists] = useState([]);
  const [receptionistLoading, setReceptionistLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!propertyId) {
      setLoading(false);
      setError("No property selected.");
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [employeesRes, servicesRes] = await Promise.all([
          getEmployees(propertyId),
          getPropertyServices(propertyId),
        ]);
        if (cancelled) return;
        const empList = employeesRes?.data?.data?.allEmployeeDetails || [];
        const svcList = servicesRes?.data?.data?.services || [];
        setEmployees(Array.isArray(empList) ? empList : []);
        setServices(Array.isArray(svcList) ? svcList : []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            "Could not load property details right now.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  useEffect(() => {
    let cancelled = false;

    if (!propertyId) {
      setReceptionists([]);
      return () => {
        cancelled = true;
      };
    }

    const loadReceptionists = async () => {
      setReceptionistLoading(true);
      try {
        const res = await getPropertyReceptionists(propertyId);
        const list = res?.data?.data?.receptionists;
        if (!cancelled) setReceptionists(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setReceptionists([]);
      } finally {
        if (!cancelled) setReceptionistLoading(false);
      }
    };

    loadReceptionists();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleViewEmployees = () => {
    navigate(`${basePath}/employee`, {
      state: {
        propertyId,
        propertyDetails: property,
        employees,
      },
    });
  };

  const handleViewServices = () => {
    navigate(`${basePath}/services`, {
      state: {
        propertyId,
        propertyDetails: property,
        services,
      },
    });
  };

  const handleViewReceptionists = () => {
    navigate(`${basePath}/receptionists`, {
      state: {
        propertyId,
        propertyDetails: property,
        receptionists,
      },
    });
  };

  const handleViewAppointments = () => {
    const today = new Date();
    const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000;
    const currentDate = new Date(today.getTime() - timezoneOffsetMs)
      .toISOString()
      .split("T")[0];

    navigate(
      `${basePath}/appointments?propertyId=${propertyId}&date=${currentDate}`,
      {
        state: {
          propertyId,
          propertyDetails: property,
        },
      },
    );
  };

  const employeeCount = employees.length;
  const serviceCount = services.length;
  const activeEmployees = employees.filter(
    (e) => (e.status || "ACTIVE").toUpperCase() === "ACTIVE",
  ).length;

  const propertyName = property?.propertyName || property?.name || "Property";
  const propertyStatus = property?.status || "ACTIVE";
  const streetPart = [property?.buildingNo, property?.street]
    .filter(Boolean)
    .join(" ");
  const cityPart = [property?.city, property?.state, property?.zipCode]
    .filter(Boolean)
    .join(", ");
  const fullAddress = [streetPart, cityPart, property?.country]
    .filter(Boolean)
    .join(", ");

  // A "dedicated" manager is one that's not the partner themselves. Owner
  // standing in (manager.isOwner === true) is treated the same as "no manager
  // yet", which matches how the dashboard renders this.
  const rawManager = property?.manager || null;
  const hasDedicatedManager = Boolean(
    rawManager && !rawManager.isOwner && rawManager.email,
  );
  const manager = hasDedicatedManager ? rawManager : null;
  const managerFirst = manager?.firstName || "";
  const managerLast = manager?.lastName || "";
  const managerFullName = `${managerFirst} ${managerLast}`.trim();
  const managerInitials =
    (managerFirst[0] || "M").toUpperCase() +
      (managerLast[0] || "").toUpperCase() || "M";

  // Close the kebab menu whenever the user clicks anywhere else on the page.
  useEffect(() => {
    if (!isManagerMenuOpen) return undefined;
    const close = () => setIsManagerMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [isManagerMenuOpen]);

  const handleOpenManagerModal = (mode) => {
    setManagerError(null);
    setManagerModalMode(mode);
    setIsManagerMenuOpen(false);
    setIsManagerModalOpen(true);
  };

  const handleManagerSaved = async () => {
    setIsManagerModalOpen(false);
    setManagerError(null);
    if (refreshProperties) {
      await refreshProperties();
    }
  };

  const handleConfirmDeleteManager = async () => {
    if (!propertyId) return;
    setIsDeletingManager(true);
    setManagerError(null);
    try {
      await removePropertyManager(propertyId);
      if (refreshProperties) {
        await refreshProperties();
      }
      setIsConfirmingManagerDelete(false);
    } catch (err) {
      setManagerError(
        err?.response?.data?.message ||
          "Failed to remove manager. Please try again.",
      );
    } finally {
      setIsDeletingManager(false);
    }
  };

  const getReceptionistInitials = getPersonInitials;
  const getReceptionistFullName = getPersonFullName;

  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>

      <div className={StyleSheet.BodyContainer}>
        <div className={StyleSheet.TopBar}>
          <button
            type="button"
            className={StyleSheet.BackButton}
            onClick={() => navigate(dashboardPath)}
          >
            <span aria-hidden="true">←</span> Back to Dashboard
          </button>
        </div>

        {/* Property Hero */}
        <section className={StyleSheet.HeroCard}>
          <div className={StyleSheet.HeroHeader}>
            <div className={StyleSheet.HeroHeading}>
              <h1 className={StyleSheet.PropertyTitle}>{propertyName}</h1>
              {fullAddress && (
                <p className={StyleSheet.AddressLine}>
                  <span aria-hidden="true">📍</span> {fullAddress}
                </p>
              )}
            </div>

            <div className={StyleSheet.HeroActions}>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={handleViewAppointments}
              >
                <span aria-hidden="true">📅</span> View Appointments
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={StyleSheet.StatsGrid}>
            <div
              className={`${StyleSheet.StatCard} ${StyleSheet.StatCardEmployees}`}
            >
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                👥
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Employees</div>
                <div className={StyleSheet.StatValue}>
                  {loading ? "…" : employeeCount}
                </div>
                <div className={StyleSheet.StatSub}>
                  {loading ? " " : `${activeEmployees} active`}
                </div>
              </div>
            </div>

            <div
              className={`${StyleSheet.StatCard} ${StyleSheet.StatCardServices}`}
            >
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                ⚙
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Services</div>
                <div className={StyleSheet.StatValue}>
                  {loading ? "…" : serviceCount}
                </div>
                <div className={StyleSheet.StatSub}>
                  {loading ? " " : "Active services"}
                </div>
              </div>
            </div>

            <div
              className={`${StyleSheet.StatCard} ${StyleSheet.StatCardStatus}`}
            >
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                🏢
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Status</div>
                <div className={StyleSheet.StatValue}>{propertyStatus}</div>
                <div className={StyleSheet.StatSub}>
                  {propertyStatus.toUpperCase() === "INACTIVE"
                    ? "Add an employee to activate"
                    : "Currently accepting bookings"}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className={StyleSheet.ErrorBanner} role="alert">
              {error}
            </div>
          )}
        </section>

        {/* Employees Section */}
        <section className={StyleSheet.Section}>
          <div className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Employees</h2>
              <p className={StyleSheet.SectionSub}>
                People who deliver services at this property.
              </p>
            </div>
            <button
              type="button"
              className={StyleSheet.SecondaryAction}
              onClick={handleViewEmployees}
            >
              Manage Employees →
            </button>
          </div>

          {loading ? (
            <div className={StyleSheet.EmptyState}>
              <p>Loading employees…</p>
            </div>
          ) : employees.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <div className={StyleSheet.EmptyIcon}>👥</div>
              <h3>No employees yet</h3>
              <p>Add your first employee to start taking appointments.</p>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={handleViewEmployees}
              >
                Add Employee
              </button>
            </div>
          ) : (
            <div className={StyleSheet.EmployeeGrid}>
              {employees.map((emp) => {
                const empId = emp.employeeId || emp.id;
                const firstName = emp.firstName || "";
                const lastName = emp.lastName || "";
                const initials =
                  (firstName[0] || "E").toUpperCase() +
                  (lastName[0] || "").toUpperCase();
                const statusRaw = (emp.status || "ACTIVE").toUpperCase();
                return (
                  <div key={empId} className={StyleSheet.EmployeeCard}>
                    <div className={StyleSheet.EmployeeAvatar}>{initials}</div>
                    <div className={StyleSheet.EmployeeBody}>
                      <div className={StyleSheet.EmployeeName}>
                        {firstName} {lastName}
                      </div>
                      {emp.email && (
                        <div className={StyleSheet.EmployeeMeta}>
                          <span aria-hidden="true">✉</span>
                          <span className={StyleSheet.EmployeeMetaText}>
                            {emp.email}
                          </span>
                        </div>
                      )}
                      {emp.phoneNumber && (
                        <div className={StyleSheet.EmployeeMeta}>
                          <span aria-hidden="true">📞</span>
                          <span className={StyleSheet.EmployeeMetaText}>
                            {emp.phoneNumber}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={StyleSheet.EmployeeStatus}
                      style={{
                        backgroundColor:
                          statusRaw === "INACTIVE" ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {statusRaw}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Services Section */}
        <section className={StyleSheet.Section}>
          <div className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Services</h2>
              <p className={StyleSheet.SectionSub}>
                What your customers can book at this property.
              </p>
            </div>
            <button
              type="button"
              className={StyleSheet.SecondaryAction}
              onClick={handleViewServices}
            >
              Manage Services →
            </button>
          </div>

          {loading ? (
            <div className={StyleSheet.EmptyState}>
              <p>Loading services…</p>
            </div>
          ) : services.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <div className={StyleSheet.EmptyIcon}>⚙</div>
              <h3>No services yet</h3>
              <p>Add services so customers can book appointments.</p>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={handleViewServices}
              >
                Add Service
              </button>
            </div>
          ) : (
            <div className={StyleSheet.ServicesGrid}>
              {services.map((svc) => {
                const svcId = svc.serviceId || svc.id;
                const name = svc.serviceName || svc.name || "Service";
                const duration = svc.serviceDuration || svc.duration || null;
                const price = svc.servicePrice ?? svc.price ?? null;
                return (
                  <div key={svcId} className={StyleSheet.ServiceCard}>
                    <div className={StyleSheet.ServiceName}>{name}</div>
                    <div className={StyleSheet.ServiceMetaRow}>
                      {duration != null && (
                        <span className={StyleSheet.ServiceMeta}>
                          <span aria-hidden="true">⏱</span> {duration} min
                        </span>
                      )}
                      {price != null && (
                        <span className={StyleSheet.ServiceMeta}>
                          <span aria-hidden="true">💲</span>
                          {price}
                        </span>
                      )}
                    </div>
                    {svc.description && (
                      <p className={StyleSheet.ServiceDescription}>
                        {svc.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Receptionists Section — front-desk, read-only access to this
            property's appointments. Preview only; add/edit/remove lives on
            the dedicated Manage Receptionists page. */}
        <section className={StyleSheet.Section}>
          <div className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Receptionists</h2>
              <p className={StyleSheet.SectionSub}>
                Front-desk access — can only view this property's
                appointments.
              </p>
            </div>
            <button
              type="button"
              className={StyleSheet.SecondaryAction}
              onClick={handleViewReceptionists}
            >
              Manage Receptionists →
            </button>
          </div>

          {receptionistLoading ? (
            <div className={StyleSheet.EmptyState}>
              <p>Loading receptionists…</p>
            </div>
          ) : receptionists.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <div className={StyleSheet.EmptyIcon}>📋</div>
              <h3>No receptionists yet</h3>
              <p>
                Add a receptionist to give front-desk staff a simple,
                read-only view of this property's appointments.
              </p>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={handleViewReceptionists}
              >
                Add Receptionist
              </button>
            </div>
          ) : (
            <div className={StyleSheet.EmployeeGrid}>
              {receptionists.map((r) => (
                <div key={r.userId} className={StyleSheet.EmployeeCard}>
                  <div className={StyleSheet.EmployeeAvatar}>
                    {getReceptionistInitials(r)}
                  </div>
                  <div className={StyleSheet.EmployeeBody}>
                    <div className={StyleSheet.EmployeeName}>
                      {getReceptionistFullName(r) || "Receptionist"}
                    </div>
                    {r.email && (
                      <div className={StyleSheet.EmployeeMeta}>
                        <span aria-hidden="true">✉</span>
                        <span className={StyleSheet.EmployeeMetaText}>
                          {r.email}
                        </span>
                      </div>
                    )}
                    {r.phoneNumber && (
                      <div className={StyleSheet.EmployeeMeta}>
                        <span aria-hidden="true">📞</span>
                        <span className={StyleSheet.EmployeeMetaText}>
                          {r.phoneNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={StyleSheet.EmployeeStatus}
                    style={{ backgroundColor: "#10b981" }}
                  >
                    Read-only
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        mode={managerModalMode}
        propertyId={propertyId}
        propertyName={propertyName}
        manager={managerModalMode === "edit" ? manager : null}
        onSaved={handleManagerSaved}
      />

      {isConfirmingManagerDelete && (
        <div
          className={StyleSheet.ConfirmOverlay}
          role="presentation"
          onClick={() =>
            !isDeletingManager && setIsConfirmingManagerDelete(false)
          }
        >
          <div
            className={StyleSheet.ConfirmCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-manager-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={StyleSheet.ConfirmIcon} aria-hidden="true">
              ⚠
            </div>
            <h3
              id="confirm-delete-manager-title"
              className={StyleSheet.ConfirmTitle}
            >
              Remove manager?
            </h3>
            <p className={StyleSheet.ConfirmBody}>
              {managerFullName || "This manager"} will be removed as the manager
              of <strong>{propertyName}</strong>. Their account stays active —
              only their assignment to this property is cleared.
            </p>

            {managerError && (
              <div className={StyleSheet.ConfirmError}>{managerError}</div>
            )}

            <div className={StyleSheet.ConfirmActions}>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={() => setIsConfirmingManagerDelete(false)}
                disabled={isDeletingManager}
              >
                Cancel
              </button>
              <button
                type="button"
                className={StyleSheet.DangerAction}
                onClick={handleConfirmDeleteManager}
                disabled={isDeletingManager}
              >
                {isDeletingManager ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
