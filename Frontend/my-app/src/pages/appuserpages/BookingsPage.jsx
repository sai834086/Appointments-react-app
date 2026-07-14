import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBookings, cancelBooking } from "../../api/userService";
import styles from "./BookingsPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faClock,
  faUserTie,
  faMapMarkerAlt,
  faHashtag,
  faHourglass,
  faXmark,
  faCalendarCheck,
  faCalendarXmark,
  faCalendarDay,
  faRotate,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_META = {
  upcoming: {
    label: "Upcoming",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#2563eb",
  },
  completed: {
    label: "Completed",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#16a34a",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#ef4444",
  },
};

function formatTo12Hour(t) {
  if (!t) return "";
  const p = t.split(":");
  if (p.length < 2) return t;
  let h = parseInt(p[0]);
  const m = p[1];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getBookings();
        const arr = res?.data?.data?.bookings || [];
        setBookings(Array.isArray(arr) ? arr : []);
      } catch {
        setError("Failed to load bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset date filter when switching tabs
  useEffect(() => {
    setDateFilter("all");
    setCustomFrom("");
    setCustomTo("");
  }, [activeTab]);

  useEffect(() => {
    if (!bookings.length) return;

    // â”€â”€ Notification deep-link: find booking by confirmation number â”€â”€
    const notifRef = location.state?.notificationRef;
    const notifType = location.state?.notificationType;
    if (notifRef) {
      const target = bookings.find((b) => b.confirmationNumber === notifRef);
      if (target) {
        const tabMap = {
          BOOKING_CONFIRMED: "upcoming",
          BOOKING_RESCHEDULED: "upcoming",
          BOOKING_CANCELLED: "cancelled",
        };
        setActiveTab(tabMap[notifType] || "upcoming");
        setHighlightedBookingId(target.appointmentId);
        // Auto-open the details modal
        setSelectedBooking(target);
        setShowModal(true);
        setTimeout(
          () =>
            document
              .getElementById(`booking-${target.appointmentId}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" }),
          400,
        );
        setTimeout(() => setHighlightedBookingId(null), 4500);
      }
      window.history.replaceState({}, document.title);
      return;
    }

    // â”€â”€ Reschedule / new booking highlight â”€â”€
    const id =
      location.state?.rescheduledBookingId ||
      location.state?.bookedAppointmentId;
    if (!id) return;
    setHighlightedBookingId(id);
    setActiveTab("upcoming");
    setTimeout(
      () =>
        document
          .getElementById(`booking-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      500,
    );
    setTimeout(() => setHighlightedBookingId(null), 4500);
    window.history.replaceState({}, document.title);
  }, [location.state, bookings]);

  const getStatus = (b) => {
    if (!b) return "upcoming";
    if (b.status === "Cancelled" || b.status === "No show") return "cancelled";
    if (b.status === "Completed") return "completed";
    return "upcoming";
  };

  const filteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
      .filter((b) => getStatus(b) === activeTab)
      .filter((b) => {
        if (dateFilter === "all") return true;
        const d = new Date(b.appointmentDate);
        d.setHours(0, 0, 0, 0);
        if (dateFilter === "today") return d.getTime() === today.getTime();
        if (dateFilter === "week") {
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 6);
          return d >= today && d <= weekEnd;
        }
        if (dateFilter === "month") {
          return (
      d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
          );
        }
        if (dateFilter === "custom") {
          if (customFrom && d < new Date(customFrom)) return false;
          if (customTo) {
            const to = new Date(customTo);
            to.setHours(23, 59, 59, 999);
            if (d > to) return false;
          }
          return true;
        }
        return true;
      })
      .sort(
        (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
  );
  }, [bookings, activeTab, dateFilter, customFrom, customTo]);

  const counts = useMemo(
    () => ({
      upcoming: bookings.filter((b) => getStatus(b) === "upcoming").length,
      completed: bookings.filter((b) => getStatus(b) === "completed").length,
      cancelled: bookings.filter((b) => getStatus(b) === "cancelled").length,
    }),
    [bookings],
  );

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    try {
      setCancelLoading(true);
      await cancelBooking(selectedBooking.appointmentId);
      setBookings((prev) =>
        prev.map((b) =>
          b.appointmentId === selectedBooking.appointmentId
            ? { ...b, status: "Cancelled" }
            : b,
        ),
  );
      setShowModal(false);
      setSelectedBooking(null);
      setError(null);
      setShowCancelConfirmModal(false);
    } catch {
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const TAB_ICONS = {
    upcoming: faCalendarDay,
    completed: faCalendarCheck,
    cancelled: faCalendarXmark,
  };

  return (
    <>
    <div className={styles.pageWrapper}>
        {/* Page title */}
        <h1 className={styles.title}>My Bookings</h1>

        {/* Tabs */}
        <div className={styles.tabs}>
          {["upcoming", "completed", "cancelled"].map((tab) => {
            const meta = STATUS_META[tab];
            const active = activeTab === tab;
            return (
        <button
                key={tab}
                className={`${styles.tabBtn} ${active ? styles.tabActive : ""}`}
                style={
                  active
                    ? { color: meta.color, borderBottomColor: meta.color }
                    : {}
                }
                onClick={() => setActiveTab(tab)}
              >
                {meta.label}
                <span
                  className={styles.tabBadge}
                  style={
                    active ? { background: meta.color, color: "#fff" } : {}
                  }
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* â”€â”€ Date filter bar â”€â”€ */}
        <div className={styles.dateFilterBar}>
          {[
            { key: "all", label: "All" },
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "custom", label: "Custom" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.dateFilterBtn} ${dateFilter === key ? styles.dateFilterActive : ""}`}
              onClick={() => setDateFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div className={styles.customDateRow}>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className={styles.dateInput}
              aria-label="From date"
            />
            <span className={styles.dateSep}>â€“</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className={styles.dateInput}
              aria-label="To date"
            />
          </div>
        )}

        {/* States */}
        {loading && (
          <div className={styles.stateBox}>Loading your bookingsâ€¦</div>
        )}
        {error && (
          <div className={`${styles.stateBox} ${styles.stateError}`}>
            {error}
          </div>
        )}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className={styles.emptyState}>
            <FontAwesomeIcon
              icon={TAB_ICONS[activeTab]}
              className={styles.emptyIcon}
            />
            <p className={styles.emptyText}>No {activeTab} bookings</p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filteredBookings.length > 0 && (
          <div className={styles.grid}>
            {filteredBookings.map((booking) => {
              const status = getStatus(booking);
              const meta = STATUS_META[status];
              const isHighlighted =
                highlightedBookingId === booking.appointmentId;
              return (
          <div
                  key={booking.appointmentId}
                  id={`booking-${booking.appointmentId}`}
                  className={`${styles.card} ${isHighlighted ? styles.cardHighlighted : ""}`}
                  style={{ borderLeftColor: meta.border }}
                >
                  {/* Card top */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardTopLeft}>
                      <p className={styles.cardProperty}>
                        {booking.propertyName}
                      </p>
                      <h3 className={styles.cardService}>
                        {booking.serviceName || booking.service || "Service"}
                      </h3>
                    </div>
                    <span
                      className={styles.statusBadge}
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Staff */}
                  {booking.employeeName && (
                    <p className={styles.cardStaff}>
                      <FontAwesomeIcon icon={faUserTie} />
                      {booking.employeeName}
                    </p>
                  )}

                  {/* Date + time row */}
                  <div className={styles.cardMeta}>
                    <span className={styles.cardMetaItem}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {formatDate(booking.appointmentDate)}
                    </span>
                    <span className={styles.cardMetaItem}>
                      <FontAwesomeIcon icon={faClock} />
                      {formatTo12Hour(booking.startTime)}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.viewBtn}
                      style={{ background: meta.color }}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowModal(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedBooking && (
        <div className={styles.backdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalProperty}>
                  {selectedBooking.propertyName}
                </p>
                <h2 className={styles.modalService}>
                  {selectedBooking.serviceName || selectedBooking.service}
                </h2>
              </div>
              <div className={styles.modalHeaderRight}>
                {(() => {
                  const meta = STATUS_META[getStatus(selectedBooking)];
                  return (
              <span
                      className={styles.statusBadge}
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  );
                })()}
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Confirmation number */}
            {selectedBooking.confirmationNumber && (
              <div className={styles.confirmBox}>
                <p className={styles.confirmBoxLabel}>
                  <FontAwesomeIcon icon={faHashtag} /> Confirmation Number
                </p>
                <p className={styles.confirmBoxCode}>
                  {selectedBooking.confirmationNumber}
                </p>
              </div>
            )}

            {/* Detail rows */}
            <div className={styles.detailRows}>
              {[
                [faUserTie, "Staff", selectedBooking.employeeName],
                [
                  faCalendarAlt,
                  "Date",
                  formatDate(selectedBooking.appointmentDate),
                ],
                [faClock, "Time", formatTo12Hour(selectedBooking.startTime)],
                [
                  faHourglass,
                  "Duration",
                  selectedBooking.durationInMinutes
                    ? `${selectedBooking.durationInMinutes} mins`
                    : null,
                ],
                [faMapMarkerAlt, "Location", selectedBooking.propertyName],
              ]
                .filter(([, , val]) => val)
                .map(([icon, label, val]) => (
                  <div key={label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <FontAwesomeIcon icon={icon} />
                      {label}
                    </span>
                    <span className={styles.detailVal}>{val}</span>
                  </div>
                ))}
            </div>

            {/* Action buttons â€” upcoming only */}
            {getStatus(selectedBooking) === "upcoming" && (
              <div className={styles.actionBtns}>
                <button
                  className={styles.rescheduleBtn}
                  onClick={() => {
                    setShowModal(false);
                    navigate("/reschedule-booking", {
                      state: { booking: selectedBooking },
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faRotate} />
                  Reschedule
                </button>
                <button
                  className={styles.cancelActionBtn}
                  onClick={() => setShowCancelConfirmModal(true)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Cancel Confirm Modal â”€â”€ */}
      {showCancelConfirmModal && selectedBooking && (
        <div
          className={styles.backdrop}
          onClick={() => setShowCancelConfirmModal(false)}
        >
          <div
            className={styles.cancelModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cancelModalIcon}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <h2 className={styles.cancelModalTitle}>Cancel Booking?</h2>
            <p className={styles.cancelModalBody}>
              Are you sure you want to cancel your{" "}
              <strong>{selectedBooking.serviceName}</strong> appointment on{" "}
              <strong>{formatDate(selectedBooking.appointmentDate)}</strong>?
              This action cannot be undone.
            </p>
            <div className={styles.cancelModalBtns}>
              <button
                className={styles.keepBtn}
                onClick={() => setShowCancelConfirmModal(false)}
                disabled={cancelLoading}
              >
                Keep Booking
              </button>
              <button
                className={styles.confirmCancelBtn}
                onClick={handleCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



