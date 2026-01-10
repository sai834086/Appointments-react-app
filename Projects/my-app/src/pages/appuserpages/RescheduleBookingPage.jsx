import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAvailabilityToAppUser,
  getAvailableSlots,
  rescheduleAppointment,
} from "../../api/userService";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./AvailabilityBookingPage.module.css";
import { Calendar } from "lucide-react";

const DAY_NAMES_UPPER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const RescheduleBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;

  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [openTillDate, setOpenTillDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState(30);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);

  useEffect(() => {
    if (!booking) {
      navigate(-1);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get employee ID and service ID from booking (now provided by backend)
        const employeeId = booking.employeeId;
        const serviceId = booking.serviceId;

        console.log("📡 REQUEST 1: Fetching employee availability...");
        console.log("Employee ID:", employeeId, "Service ID:", serviceId);

        if (!employeeId || !serviceId) {
          throw new Error(
            "Booking data is missing employeeId or serviceId. Please contact support."
          );
        }

        // Fetch employee availability
        const response = await getAvailabilityToAppUser(employeeId);
        const employeeAvailability =
          response.data?.data?.["employee availability"];
        setAvailability(employeeAvailability);

        console.log("✅ Availability fetched:", employeeAvailability);

        // Calculate cutoff date
        let cutoff = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (employeeAvailability?.appointmentsOpenTillInMonths) {
          const today = new Date();
          cutoff = new Date(
            today.getFullYear(),
            today.getMonth() +
              employeeAvailability.appointmentsOpenTillInMonths,
            today.getDate()
          );
        }
        setOpenTillDate(cutoff);

        // Try to use the current booking date first
        const today = new Date();
        let dateToSelect = null;
        const currentBookingDate = new Date(booking.appointmentDate);
        const currentBookingDayName =
          DAY_NAMES_UPPER[currentBookingDate.getDay()];

        // Check if current booking date is still available (not in past, employee works that day)
        if (
          currentBookingDate >= today &&
          currentBookingDate <= cutoff &&
          employeeAvailability?.availableDays?.includes(currentBookingDayName)
        ) {
          dateToSelect = currentBookingDate;
          console.log("✅ Using current booking date:", dateToSelect);
        } else {
          // If current booking date is not available, find the first available date
          console.log(
            "⚠️ Current booking date not available, finding next available date..."
          );
          for (let i = 0; i <= 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            const dayName = DAY_NAMES_UPPER[checkDate.getDay()];

            if (
              employeeAvailability?.availableDays?.includes(dayName) &&
              checkDate <= cutoff
            ) {
              dateToSelect = checkDate;
              console.log("✅ First available date found:", dateToSelect);
              break;
            }
          }
        }

        if (dateToSelect) {
          setSelectedDate(dateToSelect);

          // Fetch slots for the selected date
          console.log(
            "📡 REQUEST 2: Fetching available time slots for",
            dateToSelect
          );
          try {
            const slotsResponse = await getAvailableSlots(
              serviceId,
              employeeId,
              dateToSelect
            );
            const slotData = slotsResponse.data?.data?.["Availabile Slots"];
            setAvailableSlots(slotData);
            console.log("✅ Available slots fetched:", slotData);
          } catch (slotsErr) {
            console.error("❌ Error fetching slots:", slotsErr);
            setSlotsError("Failed to load available times");
          }
        } else {
          console.warn("⚠️ No available dates found for this employee");
        }
      } catch (err) {
        setError("Failed to load availability. Please try again.");
        console.error("❌ Error fetching availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [booking, navigate]);

  // Auto-open confirmation modal when slot is selected
  useEffect(() => {
    if (selectedSlot) {
      setShowConfirmation(true);
    }
  }, [selectedSlot]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && booking) {
      setSlotsLoading(true);
      setSlotsError(null);
      const fetchSlots = async () => {
        try {
          const employeeId = booking.employeeId;
          const serviceId = booking.serviceId;

          if (!employeeId || !serviceId) {
            throw new Error("Employee or service ID not found");
          }

          console.log("📡 REQUEST: Fetching slots for date", selectedDate);
          console.log(
            "Parameters: serviceId=",
            serviceId,
            "employeeId=",
            employeeId
          );

          const response = await getAvailableSlots(
            serviceId,
            employeeId,
            selectedDate
          );
          const slotData = response.data?.data?.["Availabile Slots"];
          setAvailableSlots(slotData);
          console.log("✅ Slots fetched:", slotData);
        } catch (err) {
          setSlotsError("Failed to load available times");
          console.error("❌ Error fetching slots:", err);
        } finally {
          setSlotsLoading(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDate, booking]); // Confirmation countdown
  useEffect(() => {
    if (!showConfirmation) {
      return;
    }

    setConfirmationCountdown(30);

    const confirmationInterval = setInterval(() => {
      setConfirmationCountdown((prev) => {
        if (prev <= 1) {
          setShowConfirmation(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(confirmationInterval);
  }, [showConfirmation]);

  // Check if date is bookable (not past, not current booking date)
  const isAvailableDay = (date) => {
    if (!availability?.availableDays) return false;
    return availability.availableDays.includes(DAY_NAMES_UPPER[date.getDay()]);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Format time
  const formatTo12Hour = (time24) => {
    if (!time24) return "";
    const parts = time24.split(":");
    if (parts.length < 2) return time24;
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Handle reschedule confirmation
  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;

    setRescheduling(true);
    setRescheduleError(null);

    try {
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Prepare reschedule request
      const rescheduleRequest = {
        appointmentId: booking.appointmentId,
        date: dateString,
        startTime: selectedSlot, // This is already in HH:MM:SS format from backend
      };

      console.log("📤 Sending reschedule request:", rescheduleRequest);

      // Call reschedule API
      const response = await rescheduleAppointment(rescheduleRequest);

      console.log("✅ Reschedule successful:", response);

      setRescheduleSuccess(true);
      setRescheduling(false);

      // Redirect after 5 seconds (same as error)
      setTimeout(() => {
        navigate("/bookings", {
          state: {
            rescheduleSuccess: true,
            rescheduledBookingId: booking.appointmentId,
          },
        });
      }, 5000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to reschedule. Please try again.";
      setRescheduleError(errorMessage);
      setRescheduling(false);
      console.error("❌ Error rescheduling:", err);

      // Auto-redirect after 5 seconds on error
      setTimeout(() => {
        navigate("/bookings");
      }, 5000);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!booking) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.pageWrapper}>
          <div className={styles.content}>
            <p>Invalid booking information. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.pageWrapper}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <button
            className={styles.backButton}
            onClick={handleGoBack}
            title="Go back"
          >
            &lt;
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Reschedule Booking</h1>
          </div>
        </div>

        {/* Details Card */}
        <div className={styles.detailsCard}>
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Service</h3>
            <p className={styles.detailText}>{booking.serviceName}</p>
            <p className={styles.detailSubtext}>
              Current: {new Date(booking.appointmentDate).toLocaleDateString()}{" "}
              at {formatTo12Hour(booking.startTime)}
            </p>
          </div>

          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Employee</h3>
            <p className={styles.detailText}>{booking.employeeName}</p>
          </div>

          <div className={styles.detailsSection}>
            <button
              className={styles.calendarIconBtn}
              onClick={() => setShowCalendar(!showCalendar)}
              title="Select date"
            >
              <Calendar size={32} />
            </button>
          </div>
        </div>

        {/* Availability */}
        {loading ? (
          <div className={styles.loading}>Loading availability...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : availability ? (
          <>
            {showCalendar && (
              <div
                className={styles.calendarBackdrop}
                onClick={() => setShowCalendar(false)}
              >
                <div
                  className={styles.calendarModal}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.calendarHeader}>
                    <button
                      onClick={() => {
                        setCurrentDate(
                          new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth() - 1
                          )
                        );
                      }}
                      className={styles.navButton}
                    >
                      ←
                    </button>
                    <h2 className={styles.monthName}>
                      {currentDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => {
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              currentDate.getMonth() + 1
                            )
                          );
                        }}
                        className={styles.navButton}
                      >
                        →
                      </button>
                      <button
                        className={styles.closeBtn}
                        onClick={() => setShowCalendar(false)}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className={styles.weekDays}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div key={day} className={styles.weekDay}>
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  <div className={styles.calendarGrid}>
                    {generateCalendarDays().map((date, index) => {
                      if (!date) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className={styles.emptyDay}
                          ></div>
                        );
                      }

                      const isAvailable = isAvailableDay(date);
                      const isSelected =
                        selectedDate &&
                        date.toDateString() === selectedDate.toDateString();
                      const isToday =
                        date.toDateString() === new Date().toDateString();
                      const isPast = date < new Date() && !isToday;
                      const isAfterOpenTill =
                        openTillDate && date > openTillDate;
                      const isWithinBookingWindow = !isPast && !isAfterOpenTill;
                      const canBook = isAvailable && isWithinBookingWindow;

                      return (
                        <button
                          key={date.toDateString()}
                          className={`${styles.calendarDay} ${
                            isSelected ? styles.selected : ""
                          } ${!canBook ? styles.disabled : ""}`}
                          onClick={() => {
                            setSelectedDate(date);
                            setShowCalendar(false);
                          }}
                          disabled={!canBook}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedDate && (
              <div className={styles.bookingSection}>
                <h2 className={styles.sectionTitle}>
                  Select New Time for{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h2>
                {slotsLoading ? (
                  <div className={styles.loading}>
                    Loading available slots...
                  </div>
                ) : slotsError ? (
                  <div className={styles.error}>{slotsError}</div>
                ) : availableSlots ? (
                  <div className={styles.slotsContainer}>
                    <div className={styles.slotsHeader}>
                      <h3 className={styles.slotsTitle}>
                        Available Time Slots
                      </h3>
                    </div>
                    <div className={styles.slotsList}>
                      {availableSlots.availabileSlots &&
                      availableSlots.availabileSlots.length > 0 ? (
                        availableSlots.availabileSlots.map((slot, index) => (
                          <button
                            key={index}
                            className={styles.slotButton}
                            onClick={() => {
                              setSelectedSlot(slot);
                            }}
                          >
                            {formatTo12Hour(slot)}
                          </button>
                        ))
                      ) : (
                        <p className={styles.noSlots}>
                          No available slots for this date
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {rescheduleSuccess && (
                  <div className={styles.resultBackdrop}>
                    <div
                      className={styles.resultModal}
                      style={{ borderTop: "5px solid #4caf50" }}
                    >
                      <div
                        className={styles.resultIcon}
                        style={{ color: "#4caf50" }}
                      >
                        ✓
                      </div>
                      <h2
                        className={styles.resultTitle}
                        style={{ color: "#4caf50" }}
                      >
                        Reschedule Confirmed
                      </h2>
                      <p className={styles.resultMessage}>
                        Your appointment has been rescheduled successfully.
                      </p>
                      <p className={styles.resultCountdown}>
                        Redirecting to bookings in 5 seconds...
                      </p>
                    </div>
                  </div>
                )}

                {rescheduleError && !rescheduleSuccess && (
                  <div className={styles.resultBackdrop}>
                    <div
                      className={styles.resultModal}
                      style={{ borderTop: "5px solid #f44336" }}
                    >
                      <div
                        className={styles.resultIcon}
                        style={{ color: "#f44336" }}
                      >
                        ✕
                      </div>
                      <h2
                        className={styles.resultTitle}
                        style={{ color: "#f44336" }}
                      >
                        Reschedule Failed
                      </h2>
                      <p className={styles.resultMessage}>{rescheduleError}</p>
                      <p className={styles.resultCountdown}>
                        Returning to bookings in 5 seconds...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
              <div
                className={styles.modalBackdrop}
                onClick={() => setShowConfirmation(false)}
              >
                <div
                  className={styles.confirmationModal}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className={styles.confirmModalTitle}>
                    Confirm Reschedule
                  </h2>

                  <div className={styles.timeComparisonContainer}>
                    {/* Current Appointment */}
                    <div className={styles.timeBox}>
                      <h3 className={styles.timeBoxLabel}>
                        Current Appointment
                      </h3>
                      <div className={styles.timeBoxContent}>
                        <p className={styles.timeBoxService}>
                          <strong>{booking.serviceName}</strong>
                        </p>
                        <p className={styles.timeBoxEmployee}>
                          with {booking.employeeName}
                        </p>
                        <p className={styles.timeBoxDateTime}>
                          <span className={styles.date}>
                            {new Date(
                              booking.appointmentDate
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className={styles.time}>
                            {formatTo12Hour(booking.startTime)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className={styles.arrowContainer}>
                      <span className={styles.arrow}>→</span>
                    </div>

                    {/* New Appointment */}
                    <div className={styles.timeBox}>
                      <h3 className={styles.timeBoxLabel}>New Appointment</h3>
                      <div className={styles.timeBoxContent}>
                        <p className={styles.timeBoxService}>
                          <strong>{booking.serviceName}</strong>
                        </p>
                        <p className={styles.timeBoxEmployee}>
                          with {booking.employeeName}
                        </p>
                        <p className={styles.timeBoxDateTime}>
                          <span className={styles.date}>
                            {selectedDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className={styles.time}>
                            {formatTo12Hour(selectedSlot)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {rescheduleError && (
                    <div className={styles.error}>{rescheduleError}</div>
                  )}

                  <div className={styles.confirmModalButtons}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setShowConfirmation(false)}
                      disabled={rescheduling}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.confirmBtn}
                      onClick={handleConfirmReschedule}
                      disabled={rescheduling}
                    >
                      {rescheduling ? "Confirming..." : "Confirm Reschedule"}
                    </button>
                  </div>

                  <p className={styles.countdownText}>
                    Auto-close in {confirmationCountdown}s
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.errorMsg}>
            Unable to load availability information.
          </div>
        )}
      </div>
    </div>
  );
};

export default RescheduleBookingPage;
