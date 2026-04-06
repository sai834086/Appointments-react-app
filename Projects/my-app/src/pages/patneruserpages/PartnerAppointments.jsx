import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/partnercomponent/Header";
import { getPropertyAppointments } from "../../api/authService";
import styles from "./PartnerAppointments.module.css";

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";

  const normalizedValue = value.toString().trim();
  const localSafeValue = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? `${normalizedValue}T00:00:00`
    : normalizedValue;

  const parsed = new Date(localSafeValue);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCurrentDateString = () => {
  const current = new Date();
  const timezoneOffsetMs = current.getTimezoneOffset() * 60 * 1000;
  return new Date(current.getTime() - timezoneOffsetMs)
    .toISOString()
    .split("T")[0];
};

const formatTime12Hour = (value) => {
  if (!value || value === "-") return "-";

  const normalizedValue = value.toString().trim();
  const match = normalizedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) return normalizedValue;

  const hours24 = Number(match[1]);
  const minutes = match[2];

  if (Number.isNaN(hours24) || hours24 < 0 || hours24 > 23) {
    return normalizedValue;
  }

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
};

const parseTimeToMinutes = (value) => {
  const normalizedValue = (value || "").toString().trim();
  const match = normalizedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) return -1;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return -1;
  }

  return hours * 60 + minutes;
};

const normalizeStatus = (status) => {
  if (!status) return "-";
  const value = status.toString().toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getStatusClass = (status) => {
  const normalized = (status || "").toString().toLowerCase();
  if (["booked", "confirmed", "upcoming", "scheduled"].includes(normalized)) {
    return styles.statusUpcoming;
  }
  if (["completed", "done"].includes(normalized)) {
    return styles.statusCompleted;
  }
  if (
    ["cancelled", "canceled", "rejected", "no_show", "no-show"].includes(
      normalized,
    )
  ) {
    return styles.statusCancelled;
  }
  return styles.statusPending;
};

export default function PartnerAppointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const propertyId = useMemo(() => {
    return searchParams.get("propertyId") || location.state?.propertyId || null;
  }, [searchParams, location.state]);

  const propertyDetails = useMemo(() => {
    return location.state?.propertyDetails || null;
  }, [location.state]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    () => searchParams.get("date") || getCurrentDateString(),
  );
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    const dateFromUrl = searchParams.get("date");
    if (!dateFromUrl) return;

    setSelectedDate((previousDate) =>
      previousDate === dateFromUrl ? previousDate : dateFromUrl,
    );
  }, [searchParams]);

  useEffect(() => {
    if (!propertyId) return;

    const urlDate = searchParams.get("date") || "";
    if (urlDate === selectedDate) return;

    const nextParams = new URLSearchParams(location.search);
    nextParams.set("propertyId", propertyId);
    nextParams.set("date", selectedDate);
    navigate(`/partner/appointments?${nextParams.toString()}`, {
      replace: true,
      state: location.state,
    });
  }, [
    selectedDate,
    propertyId,
    searchParams,
    location.search,
    navigate,
    location.state,
  ]);

  useEffect(() => {
    setSelectedStatusFilter("all");
  }, [selectedDate]);

  const matchesStatus = (item, filter) => {
    const status = (item?.status || "").toString().toLowerCase();
    if (filter === "all") return true;
    if (filter === "confirmed") {
      return ["booked", "confirmed", "upcoming", "scheduled"].includes(status);
    }
    if (filter === "completed") {
      return ["completed", "done"].includes(status);
    }
    if (filter === "cancelled") {
      return [
        "cancelled",
        "canceled",
        "rejected",
        "no_show",
        "no-show",
      ].includes(status);
    }
    return false;
  };

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      setError("No property selected.");
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getPropertyAppointments(
          propertyId,
          selectedDate,
        );
        const records = response?.data?.data?.appointments;
        setAppointments(Array.isArray(records) ? records : []);
      } catch {
        setError("Failed to load appointments.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [propertyId, selectedDate]);

  const propertyName = pickFirst(
    propertyDetails?.propertyName,
    propertyDetails?.name,
    appointments[0]?.propertyName,
    location.state?.propertyName,
    "Selected Property",
  );

  const propertyAddress = [
    pickFirst(propertyDetails?.buildingNo, ""),
    pickFirst(propertyDetails?.street, ""),
  ]
    .filter(Boolean)
    .join(" ");

  const counts = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter((item) => matchesStatus(item, "confirmed"))
        .length,
      completed: appointments.filter((item) => matchesStatus(item, "completed"))
        .length,
      cancelled: appointments.filter((item) => matchesStatus(item, "cancelled"))
        .length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) =>
      matchesStatus(item, selectedStatusFilter),
    );
  }, [appointments, selectedStatusFilter]);

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  const sortedAppointments = useMemo(() => {
    const sortableKeys = [
      "serial",
      "customerName",
      "employeeName",
      "serviceName",
      "appointmentDate",
      "scheduleTime",
      "status",
    ];

    const getScheduleDateTimeValue = (item) => {
      const scheduleDate = pickFirst(item?.appointmentDate, "").toString();
      const scheduleTime = pickFirst(item?.startTime, "00:00:00").toString();

      if (!scheduleDate) return 0;

      const combined = `${scheduleDate}T${scheduleTime}`;
      const timestamp = new Date(combined).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }

      const dateOnlyTimestamp = new Date(scheduleDate).getTime();
      return Number.isNaN(dateOnlyTimestamp) ? 0 : dateOnlyTimestamp;
    };

    const getSortValue = (item, key) => {
      switch (key) {
        case "serial":
          return getScheduleDateTimeValue(item);
        case "customerName":
          return pickFirst(item?.customerName, "").toString().toLowerCase();
        case "employeeName":
          return pickFirst(item?.employeeName, "").toString().toLowerCase();
        case "serviceName":
          return pickFirst(
            item?.ServiceName,
            item?.serviceName,
            item?.service,
            "",
          )
            .toString()
            .toLowerCase();
        case "appointmentDate": {
          const value = pickFirst(item?.appointmentDate, "").toString().trim();
          if (!value) return 0;
          const safeValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? `${value}T00:00:00`
            : value;
          const timestamp = new Date(safeValue).getTime();
          return Number.isNaN(timestamp) ? 0 : timestamp;
        }
        case "scheduleTime":
          return parseTimeToMinutes(pickFirst(item?.startTime, ""));
        case "status":
          return pickFirst(item?.status, "").toString().toLowerCase();
        default:
          return "";
      }
    };

    const compareSortValues = (leftValue, rightValue) => {
      const leftNumber =
        typeof leftValue === "number" && !Number.isNaN(leftValue)
          ? leftValue
          : null;
      const rightNumber =
        typeof rightValue === "number" && !Number.isNaN(rightValue)
          ? rightValue
          : null;

      if (leftNumber !== null && rightNumber !== null) {
        return leftNumber - rightNumber;
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };

    if (!sortConfig.key) {
      return [...filteredAppointments].sort(
        (left, right) =>
          getScheduleDateTimeValue(left) - getScheduleDateTimeValue(right),
      );
    }

    const sortOrder = [
      sortConfig.key,
      ...sortableKeys.filter((key) => key !== sortConfig.key),
    ];

    const sorted = [...filteredAppointments].sort((left, right) => {
      for (let index = 0; index < sortOrder.length; index += 1) {
        const key = sortOrder[index];
        const leftValue = getSortValue(left, key);
        const rightValue = getSortValue(right, key);
        const comparison = compareSortValues(leftValue, rightValue);

        if (comparison !== 0) {
          if (sortConfig.direction === "desc") {
            return -comparison;
          }
          return comparison;
        }
      }

      return 0;
    });

    return sorted;
  }, [filteredAppointments, sortConfig]);

  const renderSortHeader = (label, key) => {
    const isActive = sortConfig.key === key;
    const directionSymbol = isActive
      ? sortConfig.direction === "asc"
        ? "↑"
        : "↓"
      : "↕";

    return (
      <button
        type="button"
        className={`${styles.sortButton} ${
          isActive ? styles.sortButtonActive : ""
        }`}
        onClick={() => handleSort(key)}
      >
        <span>{label}</span>
        <span className={styles.sortIcon}>{directionSymbol}</span>
      </button>
    );
  };

  const selectedServiceName = pickFirst(
    selectedAppointment?.ServiceName,
    selectedAppointment?.serviceName,
    selectedAppointment?.service,
    "-",
  );

  return (
    <div className={styles.mainContainer}>
      <div className={styles.headerContainer}>
        <Header />
      </div>

      <div className={styles.bodyContainer}>
        <div className={styles.pageHeader}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/partner/dashboard")}
          >
            ← Back to Dashboard
          </button>
          <h1 className={styles.pageTitle}>Property Appointments</h1>
        </div>

        <div className={styles.topDateBar}>
          <div className={styles.dateFilterGroup}>
            <label
              htmlFor="appointment-date-filter"
              className={styles.dateFilterLabel}
            >
              Date
            </label>
            <input
              id="appointment-date-filter"
              type="date"
              className={styles.dateFilterInput}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.propertyCard}>
          <div>
            <p className={styles.propertyLabel}>Property</p>
            <h2 className={styles.propertyName}>{propertyName}</h2>
            {(propertyAddress ||
              propertyDetails?.city ||
              propertyDetails?.state) && (
              <p className={styles.propertyAddress}>
                {propertyAddress}
                {propertyAddress && propertyDetails?.city ? ", " : ""}
                {propertyDetails?.city || ""}
                {propertyDetails?.city && propertyDetails?.state ? ", " : ""}
                {propertyDetails?.state || ""}
              </p>
            )}
          </div>
          <div className={styles.propertyBadge}>Appointments</div>
        </div>

        <div className={styles.statsGrid}>
          <button
            type="button"
            className={`${styles.statCard} ${styles.statButton} ${
              selectedStatusFilter === "all" ? styles.statButtonActive : ""
            }`}
            onClick={() => setSelectedStatusFilter("all")}
          >
            <p>Total</p>
            <h3>{counts.total}</h3>
          </button>
          <button
            type="button"
            className={`${styles.statCard} ${styles.statButton} ${
              selectedStatusFilter === "confirmed"
                ? styles.statButtonActive
                : ""
            }`}
            onClick={() => setSelectedStatusFilter("confirmed")}
          >
            <p>Confirmed</p>
            <h3>{counts.confirmed}</h3>
          </button>
          <button
            type="button"
            className={`${styles.statCard} ${styles.statButton} ${
              selectedStatusFilter === "completed"
                ? styles.statButtonActive
                : ""
            }`}
            onClick={() => setSelectedStatusFilter("completed")}
          >
            <p>Completed</p>
            <h3>{counts.completed}</h3>
          </button>
          <button
            type="button"
            className={`${styles.statCard} ${styles.statButton} ${
              selectedStatusFilter === "cancelled"
                ? styles.statButtonActive
                : ""
            }`}
            onClick={() => setSelectedStatusFilter("cancelled")}
          >
            <p>Cancelled</p>
            <h3>{counts.cancelled}</h3>
          </button>
        </div>

        <section className={styles.appointmentsSection}>
          <div className={styles.sectionHeader}>
            <h2>Appointments List</h2>
          </div>

          {loading && (
            <div className={styles.infoBox}>Loading appointments...</div>
          )}
          {!loading && error && <div className={styles.errorBox}>{error}</div>}

          {!loading && !error && appointments.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>No appointments found</h3>
              <p>There are no appointments for this property yet.</p>
            </div>
          )}

          {!loading &&
            !error &&
            appointments.length > 0 &&
            filteredAppointments.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔎</div>
                <h3>No {selectedStatusFilter} appointments</h3>
                <p>Try another status filter to view appointments.</p>
              </div>
            )}

          {!loading && !error && filteredAppointments.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{renderSortHeader("S.No", "serial")}</th>
                    <th>{renderSortHeader("Customer", "customerName")}</th>
                    <th>{renderSortHeader("Employee", "employeeName")}</th>
                    <th>{renderSortHeader("Service", "serviceName")}</th>
                    <th>
                      {renderSortHeader("Schedule Date", "appointmentDate")}
                    </th>
                    <th>{renderSortHeader("Schedule Time", "scheduleTime")}</th>
                    <th>{renderSortHeader("Status", "status")}</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((item, index) => {
                    const appointmentId = pickFirst(
                      item?.appointmentId,
                      item?.id,
                      index + 1,
                    );
                    const serviceName = pickFirst(
                      item?.ServiceName,
                      item?.serviceName,
                      item?.service,
                    );
                    const status = normalizeStatus(item?.status);

                    return (
                      <tr key={`${appointmentId}-${index}`}>
                        <td>
                          <div className={styles.serialNumber}>{index + 1}</div>
                        </td>
                        <td>
                          <div className={styles.primaryCell}>
                            {pickFirst(item?.customerName, "-")}
                          </div>
                        </td>
                        <td>
                          <div className={styles.primaryCell}>
                            {pickFirst(item?.employeeName, "-")}
                          </div>
                        </td>
                        <td>
                          <div className={styles.primaryCell}>
                            {pickFirst(serviceName, "-")}
                          </div>
                        </td>
                        <td>
                          <div className={styles.primaryCell}>
                            {formatDate(item?.appointmentDate)}
                          </div>
                        </td>
                        <td>
                          <div className={styles.primaryCell}>
                            {formatTime12Hour(pickFirst(item?.startTime, "-"))}{" "}
                            - {formatTime12Hour(pickFirst(item?.endTime, "-"))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusClass(item?.status)}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.viewButton}
                            onClick={() => setSelectedAppointment(item)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedAppointment && (
          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className={styles.modalCard}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <p className={styles.modalEyebrow}>Appointment Details</p>
                  <h2 className={styles.modalTitle}>
                    {pickFirst(selectedAppointment?.customerName, "Customer")}
                  </h2>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setSelectedAppointment(null)}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalStatusRow}>
                <span
                  className={`${styles.statusBadge} ${getStatusClass(
                    selectedAppointment?.status,
                  )}`}
                >
                  {normalizeStatus(selectedAppointment?.status)}
                </span>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Customer</span>
                  <span className={styles.detailValue}>
                    {pickFirst(selectedAppointment?.customerName, "-")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Employee</span>
                  <span className={styles.detailValue}>
                    {pickFirst(selectedAppointment?.employeeName, "-")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Service</span>
                  <span className={styles.detailValue}>
                    {selectedServiceName}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Property</span>
                  <span className={styles.detailValue}>
                    {pickFirst(
                      selectedAppointment?.propertyName,
                      propertyName,
                      "-",
                    )}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Appointment Date</span>
                  <span className={styles.detailValue}>
                    {formatDate(selectedAppointment?.appointmentDate)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Schedule Time</span>
                  <span className={styles.detailValue}>
                    {formatTime12Hour(
                      pickFirst(selectedAppointment?.startTime, "-"),
                    )}{" "}
                    -{" "}
                    {formatTime12Hour(
                      pickFirst(selectedAppointment?.endTime, "-"),
                    )}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    Confirmation Number
                  </span>
                  <span className={styles.detailValue}>
                    {pickFirst(selectedAppointment?.confirmationNumber, "-")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Appointment ID</span>
                  <span className={styles.detailValue}>
                    {pickFirst(
                      selectedAppointment?.appointmentId,
                      selectedAppointment?.id,
                      "-",
                    )}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Booked At</span>
                  <span className={styles.detailValue}>
                    {formatDateTime(selectedAppointment?.bookedAt)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Updated At</span>
                  <span className={styles.detailValue}>
                    {formatDateTime(selectedAppointment?.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
