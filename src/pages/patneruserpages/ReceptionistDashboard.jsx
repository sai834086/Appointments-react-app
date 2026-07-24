import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { getPropertyAppointments } from "../../api/authService";
import styles from "./ReceptionistDashboard.module.css";

const getTodayDateString = () => {
  const today = new Date();
  const timezoneOffsetMs = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - timezoneOffsetMs).toISOString().split("T")[0];
};

const formatDateHeading = (value) => {
  if (!value) return "";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime12Hour = (value) => {
  if (!value) return "-";
  const [hourStr, minuteStr] = String(value).split(":");
  const hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr || "00"} ${period}`;
};

const STATUS_STYLES = {
  Booked: styles.StatusBooked,
  Completed: styles.StatusCompleted,
  Cancelled: styles.StatusCancelled,
  NoShow: styles.StatusNoShow,
};

/**
 * ReceptionistDashboard
 * ----------------------
 * A deliberately simple, read-only appointments view for the RECEPTIONIST
 * role. Receptionists can only view — not create, edit, or cancel —
 * appointments for the single property they're assigned to. There's no
 * sidebar or property-switching here; this page *is* the whole app for a
 * receptionist, so it's built for clarity: a date picker, a few summary
 * counts, and a clean list of appointment cards sorted by time.
 */
export default function ReceptionistDashboard() {
  const { properties, refreshProperties, logout, userProfile } =
    useContext(PartnerAuthContext) || {};
  const navigate = useNavigate();

  const property = properties?.[0] || null;
  const propertyId = property?.propertyId || property?.id || null;
  const propertyName = property?.propertyName || property?.name || "Property";

  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setAppointments([]);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPropertyAppointments(propertyId, selectedDate);
        const records = response?.data?.data?.appointments;
        if (!cancelled) setAppointments(Array.isArray(records) ? records : []);
      } catch {
        if (!cancelled) {
          setError("Could not load appointments right now.");
          setAppointments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", load);
    };
  }, [propertyId, selectedDate]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const timeA = a?.startTime || "";
      const timeB = b?.startTime || "";
      return timeA.localeCompare(timeB);
    });
  }, [appointments]);

  const counts = useMemo(() => {
    const summary = { total: appointments.length, Booked: 0, Completed: 0, Cancelled: 0, NoShow: 0 };
    appointments.forEach((a) => {
      const status = a?.status;
      if (status && summary[status] !== undefined) summary[status] += 1;
    });
    return summary;
  }, [appointments]);

  const handleLogout = () => {
    if (logout) logout();
    navigate("/partner/receptionist/login");
  };

  const greetingName = userProfile?.firstName || "Receptionist";

  return (
    <div className={styles.Page}>
      <header className={styles.TopBar}>
        <div>
          <div className={styles.BrandRow}>
            <span className={styles.BrandIcon} aria-hidden="true">📋</span>
            <span className={styles.BrandName}>{propertyName}</span>
          </div>
          <p className={styles.Greeting}>Welcome, {greetingName}</p>
        </div>
        <button type="button" className={styles.LogoutButton} onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className={styles.Body}>
        {!propertyId ? (
          <div className={styles.EmptyState}>
            <div className={styles.EmptyIcon}>🏢</div>
            <h2>No property assigned</h2>
            <p>Once the partner assigns you to a property, its appointments will appear here.</p>
          </div>
        ) : (
          <>
            <section className={styles.ControlsCard}>
              <div className={styles.DateControl}>
                <label htmlFor="receptionist-date" className={styles.DateLabel}>
                  Date
                </label>
                <input
                  id="receptionist-date"
                  type="date"
                  className={styles.DateInput}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={styles.TodayButton}
                onClick={() => setSelectedDate(getTodayDateString())}
              >
                Today
              </button>
            </section>

            <h1 className={styles.DateHeading}>{formatDateHeading(selectedDate)}</h1>

            <section className={styles.SummaryGrid}>
              <div className={`${styles.SummaryCard} ${styles.SummaryTotal}`}>
                <span className={styles.SummaryValue}>{counts.total}</span>
                <span className={styles.SummaryLabel}>Total</span>
              </div>
              <div className={styles.SummaryCard}>
                <span className={styles.SummaryValue}>{counts.Booked}</span>
                <span className={styles.SummaryLabel}>Booked</span>
              </div>
              <div className={styles.SummaryCard}>
                <span className={styles.SummaryValue}>{counts.Completed}</span>
                <span className={styles.SummaryLabel}>Completed</span>
              </div>
              <div className={styles.SummaryCard}>
                <span className={styles.SummaryValue}>{counts.Cancelled}</span>
                <span className={styles.SummaryLabel}>Cancelled</span>
              </div>
            </section>

            {error && (
              <div className={styles.ErrorBanner} role="alert">
                {error}
              </div>
            )}

            <section className={styles.ListSection}>
              {loading ? (
                <div className={styles.EmptyState}>
                  <p>Loading appointments…</p>
                </div>
              ) : sortedAppointments.length === 0 ? (
                <div className={styles.EmptyState}>
                  <div className={styles.EmptyIcon}>📅</div>
                  <h2>No appointments</h2>
                  <p>There are no appointments scheduled for this date.</p>
                </div>
              ) : (
                <ul className={styles.AppointmentList}>
                  {sortedAppointments.map((appt) => (
                    <li key={appt.appointmentId} className={styles.AppointmentCard}>
                      <div className={styles.TimeBlock}>
                        <div className={styles.TimeText}>
                          {formatTime12Hour(appt.startTime)}
                        </div>
                        <div className={styles.TimeSub}>
                          to {formatTime12Hour(appt.endTime)}
                        </div>
                      </div>

                      <div className={styles.AppointmentBody}>
                        <div className={styles.AppointmentHeadRow}>
                          <span className={styles.CustomerName}>
                            {appt.customerName || "Customer"}
                          </span>
                          <span
                            className={`${styles.StatusBadge} ${
                              STATUS_STYLES[appt.status] || ""
                            }`}
                          >
                            {appt.status || "Unknown"}
                          </span>
                        </div>
                        <div className={styles.AppointmentMetaRow}>
                          <span>🛎️ {appt.serviceName || "Service"}</span>
                          <span>👤 {appt.employeeName || "Unassigned"}</span>
                        </div>
                        {appt.confirmationNumber && (
                          <div className={styles.ConfirmationNumber}>
                            Confirmation #{appt.confirmationNumber}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
