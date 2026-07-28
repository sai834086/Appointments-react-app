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
  getPropertyAppointments,
} from "../../api/authService";
import { getPersonInitials, getPersonFullName } from "../../utils/personDisplay";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Settings,
  Store,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import {
  SectionCard,
  StatCircle,
  TotalsPanel,
  WeatherBadge,
  WelcomeBanner,
} from "../../components/partnercomponent/dashboard";
import StyleSheet from "./PropertyDetails.module.css";

/** Status rows in the appointments card, mirroring the partner dashboard. */
const STATUS_ROWS = [
  { key: "booked", label: "Booked", icon: CalendarCheck2, tone: "ToneBooked" },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    tone: "ToneCompleted",
  },
  { key: "cancelled", label: "Cancelled", icon: XCircle, tone: "ToneCancelled" },
];

export default function PropertyDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, refreshProperties, userType, partnerProfile } =
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

  // Appointments for one day. The API is per-date, so the picker drives a
  // single refetch rather than holding a range in memory.
  const todayIso = useMemo(() => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
  }, []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);

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

  // Overview counts. Records without an explicit status are treated as
  // ACTIVE, which matches how the dashboard renders them.
  const countActive = (list) =>
    list.filter((x) => (x.status || "ACTIVE").toUpperCase() === "ACTIVE").length;

  const employeeCount = employees.length;
  const activeEmployees = countActive(employees);

  const serviceCount = services.length;
  const activeServices = countActive(services);

  const receptionistCount = receptionists.length;
  const activeReceptionists = countActive(receptionists);

  const appointmentsByStatus = useMemo(() => {
    const tally = { total: appointments.length, booked: 0, cancelled: 0, completed: 0 };
    appointments.forEach((a) => {
      const s = String(a.status || "").toUpperCase();
      if (s === "CANCELLED") tally.cancelled += 1;
      else if (s === "COMPLETED") tally.completed += 1;
      else tally.booked += 1;
    });
    return tally;
  }, [appointments]);

  const propertyName = property?.propertyName || property?.name || "Property";
  const propertyStatus = property?.status || "ACTIVE";
  const isInactive = String(propertyStatus).toUpperCase() === "INACTIVE";

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

  useEffect(() => {
    if (!propertyId || !selectedDate) return undefined;

    let cancelled = false;

    const load = async () => {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      try {
        const res = await getPropertyAppointments(propertyId, selectedDate);
        if (cancelled) return;
        const records = res?.data?.data?.appointments;
        setAppointments(Array.isArray(records) ? records : []);
      } catch {
        if (cancelled) return;
        setAppointmentsError("Couldn't load appointments for this day.");
        setAppointments([]);
      } finally {
        if (!cancelled) setAppointmentsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId, selectedDate]);

  const isToday = selectedDate === todayIso;

  const getReceptionistInitials = getPersonInitials;
  const getReceptionistFullName = getPersonFullName;

  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>

      <div className={StyleSheet.BodyContainer}>
        <button
          type="button"
          className={StyleSheet.BackButton}
          onClick={() => navigate(dashboardPath)}
        >
          <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
          Back to dashboard
        </button>

        <WelcomeBanner
          name={partnerProfile?.firstName}
          subtitle={
            <span className={StyleSheet.BannerSubtitle}>
              {propertyName}
              <span
                className={`${StyleSheet.StatusPill} ${
                  isInactive
                    ? StyleSheet.StatusPillWarning
                    : StyleSheet.StatusPillSuccess
                }`}
              >
                <span className={StyleSheet.StatusDot} aria-hidden="true" />
                {propertyStatus}
              </span>
            </span>
          }
          actions={<WeatherBadge />}
        />

        {error && (
          <div className={StyleSheet.ErrorBanner} role="alert">
            <AlertCircle size={16} strokeWidth={2.25} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ---------- Summary: appointments + overview ---------- */}
        <div className={StyleSheet.SummaryRow}>
          <SectionCard
            title={`Appointments · ${isToday ? "Today" : selectedDate}`}
            aria-label="Appointment counts"
            actions={
              <input
                type="date"
                className={StyleSheet.DateInput}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || todayIso)}
                aria-label="Show appointments for date"
              />
            }
          >
            <div className={StyleSheet.TodayRow}>
              <StatCircle
                value={appointmentsByStatus.total}
                label="All Bookings"
                loading={appointmentsLoading}
                error={Boolean(appointmentsError)}
                unit="appointments"
              />
              <ul className={StyleSheet.StatusList} aria-busy={appointmentsLoading}>
                {STATUS_ROWS.map((row) => {
                  const { key, label, tone } = row;
                  const RowIcon = row.icon;
                  return (
                  <li key={key} className={StyleSheet.StatusRow}>
                    <span
                      className={`${StyleSheet.StatusIcon} ${StyleSheet[tone]}`}
                      aria-hidden="true"
                    >
                      <RowIcon size={15} strokeWidth={2.25} />
                    </span>
                    <span className={StyleSheet.StatusLabel}>{label}</span>
                    <span className={StyleSheet.StatusValue}>
                      {appointmentsLoading ? "—" : appointmentsByStatus[key]}
                    </span>
                  </li>
                  );
                })}
              </ul>
            </div>

            <button
              type="button"
              className={`${StyleSheet.PrimaryAction} ${StyleSheet.CardFooterAction}`}
              onClick={handleViewAppointments}
            >
              <CalendarDays size={15} strokeWidth={2.25} aria-hidden="true" />
              View appointments
            </button>
          </SectionCard>

          <div className={StyleSheet.OverviewWrap}>
          <TotalsPanel
            loading={loading}
            items={[
              {
                key: "employees",
                label: "Employees",
                icon: Users,
                total: employeeCount,
                breakdown: {
                  active: activeEmployees,
                  inactive: employeeCount - activeEmployees,
                },
              },
              {
                key: "services",
                label: "Services",
                icon: Settings,
                total: serviceCount,
                breakdown: {
                  active: activeServices,
                  inactive: serviceCount - activeServices,
                },
              },
              {
                key: "receptionists",
                label: "Receptionists",
                icon: ClipboardList,
                total: receptionistCount,
                breakdown: {
                  active: activeReceptionists,
                  inactive: receptionistCount - activeReceptionists,
                },
              },
            ]}
          />
          </div>
        </div>

        {/* ---------- Manager ---------- */}
        <section className={StyleSheet.ManagerCard}>
          <p className={StyleSheet.StatLabel}>Manager</p>

          {manager ? (
            <div className={StyleSheet.ManagerRow}>
              <span className={StyleSheet.ManagerAvatar} aria-hidden="true">
                {managerInitials}
              </span>
              <div className={StyleSheet.ManagerText}>
                <span className={StyleSheet.ManagerName}>
                  {managerFullName || "Manager"}
                </span>
                <span className={StyleSheet.ManagerMeta}>{manager.email}</span>
              </div>

              <div className={StyleSheet.MenuWrap}>
                <button
                  type="button"
                  className={StyleSheet.IconButton}
                  aria-label="Manager actions"
                  aria-expanded={isManagerMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsManagerMenuOpen((open) => !open);
                  }}
                >
                  <MoreVertical size={16} strokeWidth={2.25} aria-hidden="true" />
                </button>

                {isManagerMenuOpen && (
                  <div
                    className={StyleSheet.Menu}
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={StyleSheet.MenuItem}
                      onClick={() => handleOpenManagerModal("edit")}
                    >
                      <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                      Edit manager
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={`${StyleSheet.MenuItem} ${StyleSheet.MenuItemDanger}`}
                      onClick={() => {
                        setIsManagerMenuOpen(false);
                        setManagerError(null);
                        setIsConfirmingManagerDelete(true);
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                      Remove manager
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={StyleSheet.ManagerRow}>
              <span
                className={`${StyleSheet.ManagerAvatar} ${StyleSheet.ManagerAvatarEmpty}`}
                aria-hidden="true"
              >
                <UserCog size={17} strokeWidth={2} />
              </span>
              <div className={StyleSheet.ManagerText}>
                <span className={StyleSheet.ManagerName}>
                  No manager assigned
                </span>
                <span className={StyleSheet.ManagerMeta}>
                  You&apos;re managing this property yourself.
                </span>
              </div>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={() => handleOpenManagerModal("add")}
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                Add manager
              </button>
            </div>
          )}
        </section>

        {/* ---------- Employees ---------- */}
        <section className={StyleSheet.Section}>
          <header className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Employees</h2>
              <p className={StyleSheet.SectionSub}>
                People who deliver services at this property.
              </p>
            </div>
            <button
              type="button"
              className={`${StyleSheet.SecondaryAction} ${StyleSheet.ManageAction}`}
              onClick={handleViewEmployees}
            >
              Manage
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </header>

          {loading ? (
            <p className={StyleSheet.LoadingText}>Loading employees…</p>
          ) : employees.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <Users size={26} strokeWidth={1.75} aria-hidden="true" />
              <h3>No employees yet</h3>
              <p>Add your first employee to start taking appointments.</p>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={handleViewEmployees}
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                Add employee
              </button>
            </div>
          ) : (
            <ul className={StyleSheet.PersonGrid}>
              {employees.map((emp) => {
                const empId = emp.employeeId || emp.id;
                const firstName = emp.firstName || "";
                const lastName = emp.lastName || "";
                const initials =
                  (firstName[0] || "E").toUpperCase() +
                  (lastName[0] || "").toUpperCase();
                const inactive = (emp.status || "ACTIVE").toUpperCase() === "INACTIVE";

                return (
                  <li key={empId} className={StyleSheet.PersonCard}>
                    <span className={StyleSheet.PersonAvatar} aria-hidden="true">
                      {initials}
                    </span>
                    <div className={StyleSheet.PersonBody}>
                      <span className={StyleSheet.PersonName}>
                        {`${firstName} ${lastName}`.trim() || "Employee"}
                      </span>
                      {emp.email && (
                        <span className={StyleSheet.PersonMeta}>
                          <Mail size={13} strokeWidth={2} aria-hidden="true" />
                          {emp.email}
                        </span>
                      )}
                      {emp.phoneNumber && (
                        <span className={StyleSheet.PersonMeta}>
                          <Phone size={13} strokeWidth={2} aria-hidden="true" />
                          {emp.phoneNumber}
                        </span>
                      )}
                    </div>
                    <span
                      className={`${StyleSheet.Tag} ${
                        inactive ? StyleSheet.TagWarning : StyleSheet.TagSuccess
                      }`}
                    >
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Services ---------- */}
        <section className={StyleSheet.Section}>
          <header className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Services</h2>
              <p className={StyleSheet.SectionSub}>
                What your customers can book at this property.
              </p>
            </div>
            <button
              type="button"
              className={`${StyleSheet.SecondaryAction} ${StyleSheet.ManageAction}`}
              onClick={handleViewServices}
            >
              Manage
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </header>

          {loading ? (
            <p className={StyleSheet.LoadingText}>Loading services…</p>
          ) : services.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <Settings size={26} strokeWidth={1.75} aria-hidden="true" />
              <h3>No services yet</h3>
              <p>Add services so customers can book appointments.</p>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={handleViewServices}
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                Add service
              </button>
            </div>
          ) : (
            <ul className={StyleSheet.ServicesGrid}>
              {services.map((svc) => {
                const svcId = svc.serviceId || svc.id;
                const name = svc.serviceName || svc.name || "Service";
                const duration = svc.serviceDuration || svc.duration || null;
                const price = svc.servicePrice ?? svc.price ?? null;

                const inactive =
                  (svc.status || "ACTIVE").toUpperCase() === "INACTIVE";

                return (
                  <li key={svcId} className={StyleSheet.ServiceCard}>
                    <div className={StyleSheet.ServiceHead}>
                      <span className={StyleSheet.ServiceName}>{name}</span>
                      <span
                        className={`${StyleSheet.Tag} ${
                          inactive
                            ? StyleSheet.TagWarning
                            : StyleSheet.TagSuccess
                        }`}
                      >
                        {inactive ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <div className={StyleSheet.ServiceMetaRow}>
                      {duration != null && (
                        <span className={StyleSheet.ServiceMeta}>
                          <Clock size={13} strokeWidth={2} aria-hidden="true" />
                          {duration} min
                        </span>
                      )}
                      {price != null && (
                        <span className={StyleSheet.ServiceMeta}>
                          <DollarSign size={13} strokeWidth={2} aria-hidden="true" />
                          {price}
                        </span>
                      )}
                    </div>
                    {svc.description && (
                      <p className={StyleSheet.ServiceDescription}>
                        {svc.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Receptionists ----------
            Front-desk, read-only access to this property's appointments.
            Preview only; add/edit/remove lives on the dedicated page. */}
        <section className={StyleSheet.Section}>
          <header className={StyleSheet.SectionHeader}>
            <div>
              <h2 className={StyleSheet.SectionTitle}>Receptionists</h2>
              <p className={StyleSheet.SectionSub}>
                Front-desk access — can only view this property&apos;s
                appointments.
              </p>
            </div>
            <button
              type="button"
              className={`${StyleSheet.SecondaryAction} ${StyleSheet.ManageAction}`}
              onClick={handleViewReceptionists}
            >
              Manage
              <ArrowRight size={15} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </header>

          {receptionistLoading ? (
            <p className={StyleSheet.LoadingText}>Loading receptionists…</p>
          ) : receptionists.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <ClipboardList size={26} strokeWidth={1.75} aria-hidden="true" />
              <h3>No receptionists yet</h3>
              <p>
                Give front-desk staff a simple, read-only view of this
                property&apos;s appointments.
              </p>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={handleViewReceptionists}
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                Add receptionist
              </button>
            </div>
          ) : (
            <ul className={StyleSheet.PersonGrid}>
              {receptionists.map((r) => (
                <li key={r.userId} className={StyleSheet.PersonCard}>
                  <span className={StyleSheet.PersonAvatar} aria-hidden="true">
                    {getReceptionistInitials(r)}
                  </span>
                  <div className={StyleSheet.PersonBody}>
                    <span className={StyleSheet.PersonName}>
                      {getReceptionistFullName(r) || "Receptionist"}
                    </span>
                    {r.email && (
                      <span className={StyleSheet.PersonMeta}>
                        <Mail size={13} strokeWidth={2} aria-hidden="true" />
                        {r.email}
                      </span>
                    )}
                    {r.phoneNumber && (
                      <span className={StyleSheet.PersonMeta}>
                        <Phone size={13} strokeWidth={2} aria-hidden="true" />
                        {r.phoneNumber}
                      </span>
                    )}
                  </div>
                  <span className={`${StyleSheet.Tag} ${StyleSheet.TagNeutral}`}>
                    Read-only
                  </span>
                </li>
              ))}
            </ul>
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
            <span className={StyleSheet.ConfirmIcon} aria-hidden="true">
              <AlertTriangle size={20} strokeWidth={2} />
            </span>
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
