import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBookings, cancelBooking } from "../../api/userService";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./BookingsPage.module.css";

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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await getBookings();
        const bookingsArray = response?.data?.data?.Bookings || [];
        setBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
      } catch (err) {
        setError("Failed to load bookings");
        console.error("Error fetching bookings:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Handle rescheduled booking highlighting and scrolling
  useEffect(() => {
    if (
      location.state?.rescheduleSuccess &&
      location.state?.rescheduledBookingId
    ) {
      const bookingId = location.state.rescheduledBookingId;
      setHighlightedBookingId(bookingId);

      // Switch to upcoming tab to show the rescheduled booking
      setActiveTab("upcoming");

      // Scroll to the booking element after a short delay
      setTimeout(() => {
        const bookingElement = document.getElementById(`booking-${bookingId}`);
        if (bookingElement) {
          bookingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 500);

      // Remove highlight after animation completes (4.5 seconds)
      setTimeout(() => {
        setHighlightedBookingId(null);
      }, 4500);

      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, location]);

  // Handle newly booked appointment highlighting and scrolling
  useEffect(() => {
    if (location.state?.bookingSuccess && location.state?.bookedAppointmentId) {
      const bookingId = location.state.bookedAppointmentId;

      setHighlightedBookingId(bookingId);

      // Switch to upcoming tab to show the newly booked appointment
      setActiveTab("upcoming");

      // Scroll to the booking element after a short delay
      setTimeout(() => {
        const bookingElement = document.getElementById(`booking-${bookingId}`);
        if (bookingElement) {
          bookingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 500);

      // Remove highlight after animation completes (4.5 seconds)
      setTimeout(() => {
        setHighlightedBookingId(null);
      }, 4500);

      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, location, bookings]);

  // Helper function to determine booking status
  const getBookingStatus = (appointment) => {
    if (!appointment) return "upcoming";

    const status = appointment.status;

    // If status is "Cancelled" or "No show", return cancelled
    if (status === "Cancelled" || status === "No show") {
      return "cancelled";
    }

    // If status is "Completed", return completed
    if (status === "Completed") {
      return "completed";
    }

    // If status is "Booked" or anything else, return upcoming
    return "upcoming";
  };

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTo12Hour = (time24) => {
    if (!time24) return "";

    // Handle format "HH:MM:SS" or "HH:MM"
    const parts = time24.split(":");
    if (parts.length < 2) return time24;

    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  // Helper function to format date with day name
  const formatDateWithDay = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    return `${dayName}, ${dateString}`;
  };

  // Filter bookings based on active tab and sort by date (earliest first)
  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter(
      (booking) => getBookingStatus(booking) === activeTab,
    );

    // Sort by appointment date in ascending order (earliest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate);
      const dateB = new Date(b.appointmentDate);
      return dateA - dateB;
    });
  }, [bookings, activeTab]);

  // Count bookings by status
  const bookingCounts = useMemo(() => {
    return {
      upcoming: bookings.filter((b) => getBookingStatus(b) === "upcoming")
        .length,
      completed: bookings.filter((b) => getBookingStatus(b) === "completed")
        .length,
      cancelled: bookings.filter((b) => getBookingStatus(b) === "cancelled")
        .length,
    };
  }, [bookings]);

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setCancelLoading(true);
      await cancelBooking(selectedBooking.appointmentId);

      // Update bookings list after successful cancellation
      const updatedBookings = bookings.map((booking) =>
        booking.appointmentId === selectedBooking.appointmentId
          ? { ...booking, status: "Cancelled" }
          : booking,
      );
      setBookings(updatedBookings);

      setShowModal(false);
      setSelectedBooking(null);
      setError(null);
      setShowCancelConfirmModal(false);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.pageWrapper}>
        <div className={styles.content}>
          <h1 className={styles.title}>My Bookings</h1>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabBtn} ${
                activeTab === "upcoming" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              <span className={styles.tabLabel}>Upcoming</span>
              <span className={styles.tabCount}>{bookingCounts.upcoming}</span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeTab === "completed" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("completed")}
            >
              <span className={styles.tabLabel}>Completed</span>
              <span className={styles.tabCount}>{bookingCounts.completed}</span>
            </button>
            <button
              className={`${styles.tabBtn} ${
                activeTab === "cancelled" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("cancelled")}
            >
              <span className={styles.tabLabel}>Cancelled</span>
              <span className={styles.tabCount}>{bookingCounts.cancelled}</span>
            </button>
          </div>

          {loading && (
            <div className={styles.loading}>Loading your bookings...</div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {!loading && filteredBookings.length === 0 && (
            <div className={styles.empty}>No {activeTab} bookings found</div>
          )}

          {!loading && filteredBookings.length > 0 && (
            <div className={styles.bookingsList}>
              {filteredBookings.map((booking, index) => (
                <div
                  key={index}
                  id={`booking-${booking.appointmentId}`}
                  className={`${styles.bookingCard} ${styles[activeTab]} ${
                    highlightedBookingId === booking.appointmentId
                      ? styles.highlightedBooking
                      : ""
                  }`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.headerLeft}>
                      <p className={styles.propertyName}>
                        {booking.propertyName}
                      </p>
                      <h2 className={styles.serviceName}>
                        {booking.serviceName || booking.service || "Service"}
                      </h2>
                    </div>
                    <span className={`${styles.status} ${styles[activeTab]}`}>
                      {activeTab === "upcoming"
                        ? "Upcoming"
                        : activeTab === "completed"
                          ? "Completed"
                          : "Cancelled"}
                    </span>
                  </div>

                  <div className={styles.cardDetails}>
                    <div className={styles.dateTimeBox}>
                      <p className={styles.cardDate}>
                        {formatDateWithDay(booking.appointmentDate)}
                      </p>
                      <p className={styles.cardTime}>
                        {formatTo12Hour(booking.startTime)}
                      </p>
                    </div>

                    <button
                      className={styles.viewButton}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedBooking && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeModal}
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalPropertyName}>
                  {selectedBooking.propertyName}
                </p>
                <h2 className={styles.modalServiceName}>
                  {selectedBooking.serviceName || selectedBooking.service}
                </h2>
              </div>
              <span className={`${styles.modalStatus} ${styles[activeTab]}`}>
                {activeTab === "upcoming"
                  ? "Upcoming"
                  : activeTab === "completed"
                    ? "Completed"
                    : "Cancelled"}
              </span>
            </div>

            <div className={styles.modalConfirmation}>
              <strong>Confirmation Number:</strong>
              <p>{selectedBooking.confirmationNumber}</p>
            </div>

            <div className={styles.modalDetails}>
              {selectedBooking.employeeName && (
                <div className={styles.detailRow}>
                  <strong>Employee:</strong>
                  <span>{selectedBooking.employeeName}</span>
                </div>
              )}
              {selectedBooking.appointmentDate && (
                <div className={styles.detailRow}>
                  <strong>Date:</strong>
                  <span>{selectedBooking.appointmentDate}</span>
                </div>
              )}
              {selectedBooking.startTime && (
                <div className={styles.detailRow}>
                  <strong>Time:</strong>
                  <span>{formatTo12Hour(selectedBooking.startTime)}</span>
                </div>
              )}
              {selectedBooking.serviceTimeInMinus && (
                <div className={styles.detailRow}>
                  <strong>Duration:</strong>
                  <span>{selectedBooking.serviceTimeInMinus} mins</span>
                </div>
              )}
              {selectedBooking.propertyAddress && (
                <div className={styles.detailRow}>
                  <strong>Location:</strong>
                  <span>{selectedBooking.propertyAddress}</span>
                </div>
              )}
            </div>

            {activeTab === "upcoming" && (
              <div className={styles.modalButtonGroup}>
                <button
                  className={styles.modalRescheduleButton}
                  onClick={() => {
                    navigate("/reschedule-booking", {
                      state: { booking: selectedBooking },
                    });
                    setShowModal(false);
                  }}
                >
                  Reschedule
                </button>
                <button
                  className={styles.modalCancelButton}
                  onClick={() => setShowCancelConfirmModal(true)}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowCancelConfirmModal(false)}
        >
          <div
            className={styles.cancelConfirmModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Cancel Booking?</h2>
            <p className={styles.confirmMessage}>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </p>

            <div className={styles.confirmButtonGroup}>
              <button
                className={styles.confirmCancelBtn}
                onClick={handleCancelBooking}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                className={styles.confirmKeepBtn}
                onClick={() => setShowCancelConfirmModal(false)}
                disabled={cancelLoading}
              >
                No, Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
