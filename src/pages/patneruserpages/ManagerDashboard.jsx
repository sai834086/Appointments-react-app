import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import Header from "../../components/partnercomponent/Header";
import { getEmployees, getPropertyServices, getPropertyReceptionists } from "../../api/authService";
import { getPersonInitials, getPersonFullName } from "../../utils/personDisplay";
import StyleSheet from "./PropertyDetails.module.css";

/**
 * Manager Dashboard
 * -----------------
 * The landing page for users with the MANAGER role. A manager is always
 * assigned to exactly one property, so there's no value in showing them a
 * "pick a property" list the way the partner dashboard does — they land
 * straight on that property's employees + services, the same view a
 * partner reaches via Dashboard -> View Property.
 *
 * Managers can browse employees, services, receptionists, and appointments
 * for their property, but they cannot:
 *   - Register new properties
 *   - Add / edit / remove the property's manager (themselves)
 *   - See any other property the partner owns
 *
 * Auth + property data come from PartnerAuthContext, which for a manager
 * derives `properties` as a single-item array from their own profile.
 */
export default function ManagerDashboard() {
  const { properties, refreshProperties } = useContext(PartnerAuthContext);
  const navigate = useNavigate();

  // Managers have exactly one assigned property.
  const property = properties?.[0] || null;
  const propertyId = property?.propertyId || property?.id || null;

  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receptionists — read-only preview here; full add/edit/remove happens on
  // the dedicated "Manage Receptionists" page (handleViewReceptionists).
  const [receptionists, setReceptionists] = useState([]);
  const [receptionistLoading, setReceptionistLoading] = useState(false);

  // Refresh whenever the user lands here or returns to the tab so the manager
  // sees the latest data the partner may have changed elsewhere.
  useEffect(() => {
    if (!refreshProperties) return undefined;

    refreshProperties();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshProperties();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refreshProperties);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refreshProperties);
    };
  }, [refreshProperties]);

  useEffect(() => {
    let cancelled = false;

    if (!propertyId) {
      setLoading(false);
      setEmployees([]);
      setServices([]);
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

  const getReceptionistInitials = getPersonInitials;
  const getReceptionistFullName = getPersonFullName;

  const handleViewEmployees = () => {
    navigate(`/partner/manager/employee`, {
      state: {
        propertyId,
        propertyDetails: property,
        employees,
      },
    });
  };

  const handleViewServices = () => {
    navigate(`/partner/manager/services`, {
      state: {
        propertyId,
        propertyDetails: property,
        services,
      },
    });
  };

  const handleViewReceptionists = () => {
    navigate(`/partner/manager/receptionists`, {
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
      `/partner/manager/appointments?propertyId=${propertyId}&date=${currentDate}`,
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
  const streetPart = useMemo(
    () => [property?.buildingNo, property?.street].filter(Boolean).join(" "),
    [property?.buildingNo, property?.street],
  );
  const cityPart = useMemo(
    () =>
      [property?.city, property?.state, property?.zipCode]
        .filter(Boolean)
        .join(", "),
    [property?.city, property?.state, property?.zipCode],
  );
  const fullAddress = [streetPart, cityPart, property?.country]
    .filter(Boolean)
    .join(", ");

  if (!property) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.EmptyState}>
            <div className={StyleSheet.EmptyIcon}>🏢</div>
            <h2>No property assigned</h2>
            <p>Once the partner assigns you to a property, it will appear here.</p>
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
    </div>
  );
}
