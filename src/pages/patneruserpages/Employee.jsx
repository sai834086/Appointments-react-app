import {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import {
  getEmployees,
  getAllProperties,
  deleteEmployee,
  getEmployeeServices,
  removeServiceFromEmployee,
  getAvailabilityWithOffTime,
} from "../../api/authService";
import Header from "../../components/partnercomponent/Header";
import AddEmployeeModal from "../../components/partnercomponent/AddEmployeeModal";
import EditEmployeeModal from "../../components/partnercomponent/EditEmployeeModal";
import AddServiceToEmployeeModal from "../../components/partnercomponent/AddServiceToEmployeeModal";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  ConciergeBell,
  Mail,
  MoreVertical,
  Pause,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import StyleSheet from "./Employee.module.css";

function initialsOf(employee) {
  const f = (employee?.firstName || "").trim();
  const l = (employee?.lastName || "").trim();
  if (f || l) {
    return ((f[0] || "") + (l[0] || "")).toUpperCase() || "?";
  }
  return "?";
}

const DAY_LABELS = [
  { short: "Mo", full: "MONDAY" },
  { short: "Tu", full: "TUESDAY" },
  { short: "We", full: "WEDNESDAY" },
  { short: "Th", full: "THURSDAY" },
  { short: "Fr", full: "FRIDAY" },
  { short: "Sa", full: "SATURDAY" },
  { short: "Su", full: "SUNDAY" },
];

export default function Employee() {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, userType } = useContext(PartnerAuthContext) || {};
  const isManager = userType === "manager";
  const basePath = isManager ? "/partner/manager" : "/partner";
  const dashboardPath = `${basePath}/dashboard`;

  const [employees, setEmployees] = useState(() => {
    const initialEmployees = location.state?.employees;
    return Array.isArray(initialEmployees) ? initialEmployees : [];
  });
  const [loading, setLoading] = useState(
    !Array.isArray(location.state?.employees),
  );
  const [error, setError] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewServicesEmployee, setViewServicesEmployee] = useState(null);
  const [isAddServiceToEmployeeOpen, setIsAddServiceToEmployeeOpen] =
    useState(false);
  const [selectedEmployeeForService, setSelectedEmployeeForService] =
    useState(null);
  const [showEmployeeTooltip, setShowEmployeeTooltip] = useState(null);
  const [availabilityByEmployee, setAvailabilityByEmployee] = useState({});
  const fetchInProgressRef = useRef(false);

  // Resolve propertyId without exposing it in URL.
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

  // If we landed here with `?propertyId=...` from an old link, scrub it from the URL.
  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, {
        replace: true,
        state: location.state,
      });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findPropertyFromContext = useCallback(() => {
    if (!propertyId || !Array.isArray(properties)) return null;
    return (
      properties.find((p) => {
        const pId = p.propertyId || p.id;
        return (
          pId === propertyId || pId === parseInt(propertyId, 10)
        );
      }) || null
    );
  }, [propertyId, properties]);

  useEffect(() => {
    if (location.state?.propertyDetails) {
      setPropertyDetails(location.state.propertyDetails);
      return;
    }
    const contextProperty = findPropertyFromContext();
    if (contextProperty) {
      setPropertyDetails(contextProperty);
    }
  }, [propertyId, properties, location.state, findPropertyFromContext]);

  const fetchPropertyDetails = useCallback(async (propId) => {
    try {
      const response = await getAllProperties();
      const list = response.data || response || [];
      const property = list.find(
        (p) => (p.propertyId || p.id) === propId,
      );
      if (property) setPropertyDetails(property);
    } catch {
      // optional - silently ignore
    }
  }, []);

  const fetchEmployees = useCallback(
    async (forceRefresh = false) => {
      if (!propertyId) {
        setError("No property selected.");
        setLoading(false);
        return;
      }

      const hasNavigationEmployees =
        Array.isArray(location.state?.employees) &&
        location.state.employees.length > 0;
      if (!forceRefresh && hasNavigationEmployees) {
        setLoading(false);
        return;
      }

      if (fetchInProgressRef.current) return;

      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        setError(null);

        if (!propertyDetails && !location.state?.propertyDetails) {
          fetchPropertyDetails(propertyId);
        }

        const response = await getEmployees(propertyId);
        const employeeData = response.data?.data?.allEmployeeDetails || [];
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
      } catch (err) {
        setError(err.message || "Could not load employees right now.");
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [
      propertyId,
      fetchPropertyDetails,
      propertyDetails,
      location.state?.employees,
      location.state?.propertyDetails,
    ],
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch availability for each employee so we can show their weekly schedule
  // and how many months bookings are open.
  useEffect(() => {
    if (!Array.isArray(employees) || employees.length === 0) return;
    let cancelled = false;

    const loadAll = async () => {
      const results = await Promise.all(
        employees.map(async (emp) => {
          const empId = emp.id || emp.employeeId;
          if (!empId) return [empId, null];
          try {
            const res = await getAvailabilityWithOffTime(empId);
            const data = res.data?.data || res.data || {};

            // Prefer the aggregated fields the backend now ships at the top of
            // the payload. Fall back to deriving from the per-day list so older
            // backends still work.
            const list = Array.isArray(data.availabilityWithOffTime)
              ? data.availabilityWithOffTime
              : [];
            const derivedDays = list
              .filter(
                (a) =>
                  (a?.isAvailable || "").toString().toUpperCase() ===
                  "AVAILABILE",
              )
              .map((a) => a?.day)
              .filter(Boolean);

            const availableDays = Array.isArray(data.availableDays)
              ? data.availableDays
              : derivedDays;
            const appointmentsOpenTillInMonths =
              data.appointmentsOpenTillInMonths ??
              emp.appointmentsOpenTillInMonths ??
              null;

            return [
              empId,
              {
                availableDays,
                appointmentsOpenTillInMonths,
              },
            ];
          } catch {
            return [empId, null];
          }
        }),
      );
      if (cancelled) return;
      const map = {};
      results.forEach(([id, val]) => {
        if (id != null) map[id] = val;
      });
      setAvailabilityByEmployee(map);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [employees]);


  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const handleBackToProperty = () => {
    // For a manager, the dashboard *is* their property view (no separate
    // properties list), so "back to property" and "back to dashboard" are
    // the same destination.
    if (isManager) {
      navigate(dashboardPath);
      return;
    }
    navigate(`${basePath}/property`, {
      state: {
        propertyId,
        propertyDetails,
      },
    });
  };

  const handleAddEmployee = () => setIsAddEmployeeModalOpen(true);
  const handleCloseModal = () => setIsAddEmployeeModalOpen(false);

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsEditEmployeeModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditEmployeeModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleViewAvailability = (employee) => {
    navigate(`${basePath}/availability`, {
      state: {
        employee,
        propertyId,
        propertyDetails,
      },
    });
  };

  const handleViewServices = async (employee) => {
    try {
      const employeeId = employee.id || employee.employeeId;
      const response = await getEmployeeServices(employeeId);

      const list =
        response.data?.data?.["employeeServices"] &&
        Array.isArray(response.data.data["employeeServices"])
          ? response.data.data["employeeServices"]
          : [];
      setViewServicesEmployee({ ...employee, servicesList: list });
    } catch (err) {
      console.error("Error fetching employee services:", err);
      setViewServicesEmployee({ ...employee, servicesList: [] });
    }
  };

  const handleCloseServicesModal = () => setViewServicesEmployee(null);

  const handleOpenAddServiceToEmployee = (employee) => {
    setSelectedEmployeeForService(employee);
    setIsAddServiceToEmployeeOpen(true);
  };

  const handleCloseAddServiceToEmployee = () => {
    setIsAddServiceToEmployeeOpen(false);
    setSelectedEmployeeForService(null);
  };

  const handleServiceAddedToEmployee = async () => {
    if (!selectedEmployeeForService) return;
    try {
      const employeeId =
        selectedEmployeeForService.id || selectedEmployeeForService.employeeId;
      const response = await getEmployeeServices(employeeId);
      const list =
        response.data?.data?.["employeeServices"] &&
        Array.isArray(response.data.data["employeeServices"])
          ? response.data.data["employeeServices"]
          : [];
      setViewServicesEmployee((prev) =>
        prev ? { ...prev, servicesList: list } : prev,
      );
    } catch (err) {
      console.error("Error refreshing employee services:", err);
    }
  };

  const handleRemoveServiceFromEmployee = async (service) => {
    if (
      !window.confirm(
        `Remove ${service.serviceName} from this employee?`,
      )
    ) {
      return;
    }

    try {
      const employeeId =
        viewServicesEmployee.id || viewServicesEmployee.employeeId;
      const serviceId = service.id || service.serviceId;
      await removeServiceFromEmployee(propertyId, employeeId, serviceId);

      const response = await getEmployeeServices(employeeId);
      const list =
        response.data?.data?.["employeeServices"] &&
        Array.isArray(response.data.data["employeeServices"])
          ? response.data.data["employeeServices"]
          : [];
      setViewServicesEmployee((prev) =>
        prev ? { ...prev, servicesList: list } : prev,
      );
    } catch (err) {
      console.error("Error removing service:", err);
      alert("Failed to remove service. Please try again.");
    }
  };

  const handleEmployeeUpdated = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployees(propertyId);
      const employeeData = response.data?.data?.allEmployeeDetails || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeAdded = async (newEmployeeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployees(propertyId);
      const employeeData = response.data?.data?.allEmployeeDetails || [];
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (err) {
      setError(err.message);
      if (Array.isArray(newEmployeeData)) {
        setEmployees(newEmployeeData);
      } else if (newEmployeeData && Array.isArray(newEmployeeData.employees)) {
        setEmployees(newEmployeeData.employees);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = (employee) => setDeletingEmployee(employee);

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    const employeeId = deletingEmployee.id || deletingEmployee.employeeId;
    if (!employeeId) {
      setError("Unable to identify employee for deletion");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteEmployee(employeeId);
      setEmployees((prev) =>
        prev.filter((emp) => (emp.id || emp.employeeId) !== employeeId),
      );
      setDeletingEmployee(null);
    } catch (err) {
      let errorMessage = "Failed to delete employee. Please try again.";
      if (
        err.response?.status === 500 &&
        err.response?.data?.message?.includes("No static resource")
      ) {
        errorMessage =
          "Delete functionality is not yet available on the server. Please contact support.";
      } else if (err.response?.status === 404) {
        errorMessage =
          "Delete endpoint not found. This feature may not be implemented yet.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteEmployee = () => setDeletingEmployee(null);

  const toggleMenu = (employeeId) =>
    setOpenMenuId(openMenuId === employeeId ? null : employeeId);

  const closeMenu = () => setOpenMenuId(null);

  const getEmployeeId = (employee, index) =>
    employee.id || employee.employeeId || `employee-${index}`;

  const totalCount = employees.length;
  const activeCount = employees.filter(
    (e) => (e.status || "").toUpperCase() === "ACTIVE",
  ).length;
  const inactiveCount = totalCount - activeCount;

  const propertyName =
    propertyDetails?.propertyName || propertyDetails?.name || "Property";

  if (!propertyId) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.EmptyState}>
            <div className={StyleSheet.EmptyIcon}>
              <Building2 size={26} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h2>No property selected</h2>
            <p>Select a property from the dashboard to view its employees.</p>
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
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
            Back to Property
          </button>
        </div>

        {/* ---------- Header ---------- */}
        <section className={StyleSheet.HeroCard}>
          <div className={StyleSheet.HeroHeader}>
            <div className={StyleSheet.HeroHeading}>
              <h1 className={StyleSheet.PageTitle}>Employees</h1>
              <p className={StyleSheet.SubLine}>
                <span className={StyleSheet.SubAccent}>{propertyName}</span>
                <span className={StyleSheet.SubDot} aria-hidden="true">
                  •
                </span>
                <span className={StyleSheet.SubText}>
                  {loading
                    ? "Loading…"
                    : `${totalCount} ${totalCount === 1 ? "person" : "people"}`}
                </span>
              </p>
            </div>

            <button
              type="button"
              className={StyleSheet.PrimaryAction}
              onClick={handleAddEmployee}
            >
              <Plus size={15} strokeWidth={2.25} aria-hidden="true" />
              Add Employee
            </button>
          </div>

          <div className={StyleSheet.StatsGrid}>
            <div className={`${StyleSheet.StatCard} ${StyleSheet.StatTotal}`}>
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                <Users size={18} strokeWidth={2} />
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Total team</div>
                <div className={StyleSheet.StatValue}>
                  {loading ? "—" : totalCount}
                </div>
              </div>
            </div>

            <div className={`${StyleSheet.StatCard} ${StyleSheet.StatActive}`}>
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                <CalendarDays size={18} strokeWidth={2} />
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Active</div>
                <div className={StyleSheet.StatValue}>
                  {loading ? "—" : activeCount}
                </div>
              </div>
            </div>

            <div className={`${StyleSheet.StatCard} ${StyleSheet.StatInactive}`}>
              <div className={StyleSheet.StatIcon} aria-hidden="true">
                <Pause size={18} strokeWidth={2} />
              </div>
              <div className={StyleSheet.StatBody}>
                <div className={StyleSheet.StatLabel}>Inactive</div>
                <div className={StyleSheet.StatValue}>
                  {loading ? "—" : inactiveCount}
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

        {/* ---------- Employee rows ---------- */}
        <section className={StyleSheet.Section}>
          {loading ? (
            <div className={StyleSheet.LoadingContainer}>
              <div className={StyleSheet.LoadingSpinner} aria-hidden="true" />
              <p>Loading employees…</p>
            </div>
          ) : !Array.isArray(employees) || employees.length === 0 ? (
            <div className={StyleSheet.EmptyState}>
              <div className={StyleSheet.EmptyIcon}>
                <Users size={26} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3>No employees yet</h3>
              <p>Add your first employee to start taking appointments.</p>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={handleAddEmployee}
              >
                <Plus size={15} strokeWidth={2.25} aria-hidden="true" />
                Add First Employee
              </button>
            </div>
          ) : (
            <ul className={StyleSheet.EmployeeList}>
              {employees.map((employee, index) => {
                const employeeId = getEmployeeId(employee, index);
                const isActive =
                  (employee.status || "").toUpperCase() === "ACTIVE";
                const fullName =
                  `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
                  "Unknown Employee";

                const avail = availabilityByEmployee[employeeId];
                const availableDays = avail?.availableDays || [];
                const months =
                  avail?.appointmentsOpenTillInMonths ??
                  employee.appointmentsOpenTillInMonths;
                const monthsNum = months ? parseInt(months, 10) : null;

                return (
                  <li key={employeeId} className={StyleSheet.EmployeeRow}>
                    {/* Identity */}
                    <div className={StyleSheet.RowIdentity}>
                      <span className={StyleSheet.EmployeeAvatar}>
                        {initialsOf(employee)}
                      </span>
                      <div className={StyleSheet.EmployeeIdentity}>
                        <h3 className={StyleSheet.EmployeeName}>{fullName}</h3>
                        <p className={StyleSheet.EmployeeRole}>
                          {employee.roles?.length > 0
                            ? employee.roles.join(", ")
                            : "Staff"}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={StyleSheet.StatusRow}>
                      <span
                        className={`${StyleSheet.StatusPill} ${
                          isActive
                            ? StyleSheet.StatusActive
                            : StyleSheet.StatusInactive
                        }`}
                      >
                        <span
                          className={StyleSheet.StatusDot}
                          aria-hidden="true"
                        />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      {!isActive && (
                        <span className={StyleSheet.TooltipWrap}>
                          <button
                            type="button"
                            className={StyleSheet.InfoButton}
                            onClick={() =>
                              setShowEmployeeTooltip(
                                showEmployeeTooltip === employeeId
                                  ? null
                                  : employeeId,
                              )
                            }
                            aria-label="Why is this employee inactive?"
                          >
                            ?
                          </button>
                          {showEmployeeTooltip === employeeId && (
                            <div className={StyleSheet.TooltipPopup}>
                              <button
                                type="button"
                                className={StyleSheet.TooltipClose}
                                onClick={() => setShowEmployeeTooltip(null)}
                                aria-label="Close"
                              >
                                ×
                              </button>
                              <p>Add availability to activate this employee.</p>
                            </div>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Contact */}
                    <div className={StyleSheet.EmployeeDetails}>
                      <div className={StyleSheet.DetailRow}>
                        <span
                          className={StyleSheet.DetailIcon}
                          aria-hidden="true"
                        >
                          <Mail size={14} strokeWidth={2} />
                        </span>
                        <span className={StyleSheet.DetailText}>
                          {employee.email || "Not provided"}
                        </span>
                      </div>
                      <div className={StyleSheet.DetailRow}>
                        <span
                          className={StyleSheet.DetailIcon}
                          aria-hidden="true"
                        >
                          <Phone size={14} strokeWidth={2} />
                        </span>
                        <span className={StyleSheet.DetailText}>
                          {employee.phoneNumber || "Not provided"}
                        </span>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className={StyleSheet.AvailabilityBlock}>
                      <div className={StyleSheet.AvailabilityHeader}>
                        <span className={StyleSheet.AvailabilityLabel}>
                          Weekly availability
                        </span>
                        <span className={StyleSheet.AvailabilityCount}>
                          {availableDays.length}/7 days
                        </span>
                      </div>
                      <div
                        className={StyleSheet.DayStrip}
                        role="list"
                        aria-label="Days available for booking"
                      >
                        {DAY_LABELS.map((d) => {
                          const isAvail = availableDays.includes(d.full);
                          return (
                            <span
                              key={d.full}
                              className={`${StyleSheet.DayPill} ${
                                isAvail
                                  ? StyleSheet.DayPillOn
                                  : StyleSheet.DayPillOff
                              }`}
                              role="listitem"
                              title={`${d.full.charAt(0)}${d.full
                                .slice(1)
                                .toLowerCase()}: ${
                                isAvail ? "available" : "unavailable"
                              }`}
                            >
                              {d.short}
                            </span>
                          );
                        })}
                      </div>
                      <div className={StyleSheet.BookingWindow}>
                        <CalendarClock
                          size={14}
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                        {monthsNum != null && monthsNum > 0
                          ? `Bookings open for ${monthsNum} month${
                              monthsNum === 1 ? "" : "s"
                            }`
                          : "Booking window not set"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={StyleSheet.EmployeeActions}>
                      <button
                        type="button"
                        className={StyleSheet.SecondaryAction}
                        onClick={() => handleViewAvailability(employee)}
                      >
                        <CalendarDays
                          size={14}
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                        Availability
                      </button>
                      <button
                        type="button"
                        className={StyleSheet.SecondaryAction}
                        onClick={() => handleViewServices(employee)}
                      >
                        <ConciergeBell
                          size={14}
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                        Services
                      </button>
                      <div className={StyleSheet.EmployeeMenuWrapper}>
                        <button
                          type="button"
                          className={StyleSheet.MenuToggle}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(employeeId);
                          }}
                          aria-label="Open employee menu"
                        >
                          <MoreVertical
                            size={16}
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        </button>
                        {openMenuId === employeeId && (
                          <div
                            className={StyleSheet.MenuDropdown}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={StyleSheet.MenuOption}
                              onClick={() => {
                                handleEditEmployee(employee);
                                closeMenu();
                              }}
                            >
                              <Pencil
                                size={14}
                                strokeWidth={2.25}
                                aria-hidden="true"
                              />
                              Edit
                            </button>
                            <button
                              type="button"
                              className={`${StyleSheet.MenuOption} ${StyleSheet.MenuOptionDelete}`}
                              onClick={() => {
                                handleDeleteEmployee(employee);
                                closeMenu();
                              }}
                              disabled={loading}
                            >
                              <Trash2
                                size={14}
                                strokeWidth={2.25}
                                aria-hidden="true"
                              />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Services Modal */}
      {viewServicesEmployee && (
        <div
          className={StyleSheet.ModalOverlay}
          onClick={handleCloseServicesModal}
          role="presentation"
        >
          <div
            className={StyleSheet.ModalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-modal-title"
          >
            <div className={StyleSheet.ModalHeader}>
              <div className={StyleSheet.ModalIdentity}>
                <span
                  className={StyleSheet.ModalAvatar}
                >
                  {initialsOf(viewServicesEmployee)}
                </span>
                <div>
                  <div
                    id="services-modal-title"
                    className={StyleSheet.ModalTitle}
                  >
                    {viewServicesEmployee.firstName}{" "}
                    {viewServicesEmployee.lastName}
                  </div>
                  <div className={StyleSheet.ModalSub}>Services assigned</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseServicesModal}
                className={StyleSheet.ModalClose}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>

            <div className={StyleSheet.ModalBody}>
              {Array.isArray(viewServicesEmployee.servicesList) &&
              viewServicesEmployee.servicesList.length > 0 ? (
                <div className={StyleSheet.ServicesList}>
                  {viewServicesEmployee.servicesList.map((service, idx) => (
                    <div
                      key={service.id || idx}
                      className={StyleSheet.ServiceItem}
                    >
                      <div className={StyleSheet.ServiceItemHeader}>
                        <div>
                          <div className={StyleSheet.ServiceItemName}>
                            {service.serviceName}
                          </div>
                          <div className={StyleSheet.ServiceItemMetaRow}>
                            <span className={StyleSheet.ServiceMeta}>
                              <CalendarClock size={13} strokeWidth={2.25} aria-hidden="true" />{" "}
                              {service.eachServiceTimeInMinus} min
                            </span>
                            <span className={StyleSheet.ServiceMeta}>
                              <CalendarDays size={13} strokeWidth={2.25} aria-hidden="true" /> $
                              {service.serviceFee}
                            </span>
                          </div>
                        </div>
                      </div>
                      {service.description && (
                        <p className={StyleSheet.ServiceDescription}>
                          {service.description}
                        </p>
                      )}
                      <div className={StyleSheet.ServiceItemActions}>
                        <button
                          type="button"
                          className={StyleSheet.RemoveServiceButton}
                          onClick={() =>
                            handleRemoveServiceFromEmployee(service)
                          }
                        >
                          <Trash2 size={14} strokeWidth={2.25} aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={StyleSheet.EmptyState}>
                  <div className={StyleSheet.EmptyIcon}>
                  <ConciergeBell size={26} strokeWidth={1.75} aria-hidden="true" />
                </div>
                  <h3>No services assigned</h3>
                  <p>Add a service to get this employee bookable.</p>
                </div>
              )}
            </div>

            <div className={StyleSheet.ModalFooter}>
              <button
                type="button"
                className={StyleSheet.PrimaryAction}
                onClick={() =>
                  handleOpenAddServiceToEmployee(viewServicesEmployee)
                }
              >
                <Plus size={15} strokeWidth={2.25} aria-hidden="true" /> Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={handleCloseModal}
        propertyId={propertyId}
        onEmployeeAdded={handleEmployeeAdded}
      />

      <EditEmployeeModal
        isOpen={isEditEmployeeModalOpen}
        onClose={handleCloseEditModal}
        employee={selectedEmployee}
        propertyId={propertyId}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      {deletingEmployee && (
        <div
          className={StyleSheet.ModalOverlay}
          onClick={cancelDeleteEmployee}
          role="presentation"
        >
          <div
            className={`${StyleSheet.ModalCard} ${StyleSheet.ConfirmCard}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div className={StyleSheet.ConfirmIcon} aria-hidden="true">
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
            <h3 id="delete-confirm-title" className={StyleSheet.ConfirmTitle}>
              Delete employee?
            </h3>
            <p className={StyleSheet.ConfirmName}>
              {deletingEmployee.firstName} {deletingEmployee.lastName}
            </p>
            <p className={StyleSheet.ConfirmBody}>
              This will permanently remove the employee and all associated data.
              This action cannot be undone.
            </p>
            <div className={StyleSheet.ConfirmActions}>
              <button
                type="button"
                className={StyleSheet.SecondaryAction}
                onClick={cancelDeleteEmployee}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={StyleSheet.DangerAction}
                onClick={confirmDeleteEmployee}
                disabled={loading}
              >
                {loading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddServiceToEmployeeModal
        isOpen={isAddServiceToEmployeeOpen}
        onClose={handleCloseAddServiceToEmployee}
        employee={selectedEmployeeForService}
        property={propertyDetails}
        onServiceAdded={handleServiceAddedToEmployee}
      />
    </div>
  );
}
