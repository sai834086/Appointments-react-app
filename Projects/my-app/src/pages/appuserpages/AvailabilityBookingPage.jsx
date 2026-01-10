import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAvailabilityToAppUser,
  getAvailableSlots,
  bookAppointment,
} from "../../api/userService";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./AvailabilityBookingPage.module.css";
import { Calendar, Info } from "lucide-react";

const AvailabilityBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const service = location.state?.service;
  const employee = location.state?.employee;

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
  const [refreshCount, setRefreshCount] = useState(0);
  const [showRefreshLimit, setShowRefreshLimit] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [showRefreshInfo, setShowRefreshInfo] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState(30);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Day mapping
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    if (!employee) {
      navigate(-1);
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAvailabilityToAppUser(employee.employeeId);
        // Extract the EmployeeAvailabilityResponse from the correct path
        const employeeAvailability =
          response.data?.data?.["employee availability"];
        setAvailability(employeeAvailability);

        console.log("Availability Response:", employeeAvailability);

        // Calculate cutoff date based on appointmentsOpenTillInMonths field
        // Sets the cutoff to exactly N months from today
        let cutoff = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year from now
        if (employeeAvailability?.appointmentsOpenTillInMonths) {
          const today = new Date();
          cutoff = new Date(
            today.getFullYear(),
            today.getMonth() +
              employeeAvailability.appointmentsOpenTillInMonths,
            today.getDate() // Same day, N months later
          );
          console.log("Cutoff Date:", cutoff);
        }
        setOpenTillDate(cutoff);

        // Find the first available date and fetch its slots
        const today = new Date();
        let dateToSelect = null;

        // Check if today is available, then check future dates
        const dayNames = [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ];
        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          const dayName = dayNames[checkDate.getDay()];

          if (
            employeeAvailability?.availableDays?.includes(dayName) &&
            checkDate <= cutoff
          ) {
            dateToSelect = checkDate;
            break;
          }
        }

        if (dateToSelect) {
          setSelectedDate(dateToSelect);

          // Fetch slots for the first available date
          try {
            const slotsResponse = await getAvailableSlots(
              service.serviceId,
              employee.employeeId,
              dateToSelect
            );
            const slots = slotsResponse.data?.data?.["Availabile Slots"];
            setAvailableSlots(slots);
            console.log("Available Slots for first available date:", slots);
          } catch (slotsErr) {
            console.error("Error fetching slots:", slotsErr);
          }
        } else {
          console.warn("No available dates found for this employee");
        }
      } catch (err) {
        setError("Failed to load availability");
        console.error("Error fetching availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [employee, service, navigate]);

  // Fetch available slots when a date is selected
  useEffect(() => {
    if (selectedDate && service && employee) {
      setSlotsLoading(true);
      setSlotsError(null);
      const fetchSlots = async () => {
        try {
          const response = await getAvailableSlots(
            service.serviceId,
            employee.employeeId,
            selectedDate
          );
          const slots = response.data?.data?.["Availabile Slots"];
          setAvailableSlots(slots);
          console.log("Available Slots:", slots);
        } catch (err) {
          setSlotsError("Failed to load available slots");
          console.error("Error fetching slots:", err);
        } finally {
          setSlotsLoading(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDate, service, employee]);

  // Auto-refresh slots every minute with 15 refresh limit
  useEffect(() => {
    if (!selectedDate || !service || !employee || refreshCount >= 15) {
      return;
    }

    // Initial countdown reset
    setRefreshCountdown(60);

    const refreshInterval = setInterval(() => {
      setRefreshCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 15) {
          setShowRefreshLimit(true);
          clearInterval(refreshInterval);
        }
        return newCount;
      });

      // Reset countdown to 60 after refresh
      setRefreshCountdown(60);

      // Fetch latest slots
      (async () => {
        try {
          const response = await getAvailableSlots(
            service.serviceId,
            employee.employeeId,
            selectedDate
          );
          const slots = response.data?.data?.["Availabile Slots"];
          setAvailableSlots(slots);
          console.log("Auto-refreshed Available Slots:", slots);
        } catch (err) {
          console.error("Error auto-refreshing slots:", err);
        }
      })();
    }, 60000); // Refresh every 60 seconds (1 minute)

    return () => clearInterval(refreshInterval);
  }, [selectedDate, service, employee, refreshCount]);

  // Countdown timer for next refresh
  useEffect(() => {
    if (!selectedDate || refreshCount >= 15) {
      return;
    }

    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 60; // Reset to 60 when it reaches 0
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [selectedDate, refreshCount]);

  // Confirmation countdown timer - auto-close after 30 seconds
  useEffect(() => {
    if (!showConfirmation) {
      return;
    }

    setConfirmationCountdown(30); // Reset to 30 when modal opens

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

  const isAvailableDay = (date) => {
    if (!availability?.availableDays) return false;
    const dayName = dayNames[date.getDay()];
    // Convert to uppercase to match backend day names (MONDAY, TUESDAY, etc.)
    return availability.availableDays.includes(dayName.toUpperCase());
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  // Format time from 24-hour to 12-hour format with AM/PM
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

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );

    // Don't allow navigation beyond opentill date
    if (openTillDate && nextMonth > openTillDate) {
      return;
    }

    setCurrentDate(nextMonth);
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  if (!service || !employee) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.pageWrapper}>
          <div className={styles.errorMsg}>
            No employee or service selected.
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
            onClick={() => navigate(-1)}
            title="Go back"
          >
            &lt;
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Select Date & Time</h1>
          </div>
        </div>

        {/* Details Card */}
        <div className={styles.detailsCard}>
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Service</h3>
            <p className={styles.detailText}>{service.serviceName}</p>
            <p className={styles.detailSubtext}>
              {service.propertyName} • {service.eachServiceTimeInMinus} mins
            </p>
            <p className={styles.price}>
              ${parseFloat(service.serviceFee || service.price).toFixed(2)}
            </p>
          </div>

          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Employee</h3>
            <p className={styles.detailText}>
              {employee.firstName} {employee.lastName}
            </p>
            {employee.email && (
              <p className={styles.detailSubtext}>{employee.email}</p>
            )}
            {employee.phone && (
              <p className={styles.detailSubtext}>{employee.phone}</p>
            )}
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
                      onClick={goToPreviousMonth}
                      className={styles.navButton}
                    >
                      ←
                    </button>
                    <h2 className={styles.monthName}>{monthName}</h2>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={goToNextMonth}
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
                    {calendarDays.map((date, index) => {
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
                          key={date.toISOString()}
                          className={`${styles.calendarDay} ${
                            canBook ? styles.available : ""
                          } ${isSelected ? styles.selected : ""} ${
                            isToday ? styles.today : ""
                          } ${!isWithinBookingWindow ? styles.disabled : ""}`}
                          onClick={() => {
                            if (canBook) {
                              setSelectedDate(date);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={!canBook}
                          title={
                            isPast
                              ? "Past date"
                              : isAfterOpenTill
                              ? "Outside booking window"
                              : !isAvailable
                              ? "Not available on this day"
                              : "Available"
                          }
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
              <>
                <div className={styles.selectedDateCard}>
                  <h3>Selected Date</h3>
                  <p className={styles.selectedDate}>
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Available Slots */}
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
                      {selectedDate && refreshCount < 15 && (
                        <div className={styles.refreshInfo}>
                          <span className={styles.refreshCount}>
                            Auto-refresh: {refreshCount} / 15
                          </span>
                          <span className={styles.refreshTimer}>
                            Next in {refreshCountdown}s
                          </span>
                          <button
                            className={styles.infoButton}
                            onClick={() => setShowRefreshInfo(!showRefreshInfo)}
                            title="Auto-refresh information"
                          >
                            <Info size={18} />
                          </button>
                          {showRefreshInfo && (
                            <div className={styles.infoTooltip}>
                              <p>
                                <strong>Auto-Refresh Information</strong>
                              </p>
                              <ul>
                                <li>
                                  Available slots auto-reload every 1 minute
                                </li>
                                <li>
                                  Auto-refresh limit: 15 times (~15 minutes)
                                </li>
                                <li>
                                  After reaching the limit, you must reload the
                                  page
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
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
                              setShowConfirmation(true);
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
              </>
            )}
          </>
        ) : (
          availability &&
          !showCalendar && (
            <div className={styles.selectDatePrompt}>
              Click the calendar icon above to select a date
            </div>
          )
        )}

        {/* Slot Confirmation Modal */}
        {showConfirmation && selectedSlot && (
          <div
            className={styles.confirmationBackdrop}
            onClick={() => setShowConfirmation(false)}
          >
            <div
              className={styles.confirmationModal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Confirm Your Booking</h2>

              <div className={styles.confirmationDetails}>
                <div className={styles.confirmationRow}>
                  <span className={styles.label}>Service:</span>
                  <span className={styles.value}>{service.serviceName}</span>
                </div>

                <div className={styles.confirmationRow}>
                  <span className={styles.label}>Employee:</span>
                  <span className={styles.value}>
                    {employee.firstName} {employee.lastName}
                  </span>
                </div>

                <div className={styles.confirmationRow}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className={styles.confirmationRow}>
                  <span className={styles.label}>Time Slot:</span>
                  <span className={styles.valueHighlight}>
                    {formatTo12Hour(selectedSlot)}
                  </span>
                </div>
              </div>

              <div className={styles.confirmationFooter}>
                <p className={styles.countdownText}>
                  Auto-closing in <strong>{confirmationCountdown}s</strong>
                </p>

                <div className={styles.confirmationButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={async () => {
                      setBookingLoading(true);
                      setBookingError(null);

                      try {
                        // Prepare appointment request
                        const appointmentRequest = {
                          employeeId: employee.employeeId,
                          serviceId: service.serviceId,
                          date: selectedDate.toISOString().split("T")[0],
                          startTime: selectedSlot,
                        };

                        console.log("Booking appointment:", appointmentRequest);

                        const response = await bookAppointment(
                          appointmentRequest
                        );
                        const confirmationNumber =
                          response.data?.data?.["confirmation number"];

                        setBookingSuccess(confirmationNumber);
                        setShowConfirmation(false);

                        console.log(
                          "Booking successful! Confirmation:",
                          confirmationNumber
                        );
                      } catch (err) {
                        console.error("Booking error:", err);
                        setBookingError(
                          err.response?.data?.message ||
                            "Failed to book appointment"
                        );
                      } finally {
                        setBookingLoading(false);
                      }
                    }}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? "Processing..." : "Book"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Limit Modal */}
        {showRefreshLimit && (
          <div className={styles.refreshLimitBackdrop}>
            <div className={styles.refreshLimitModal}>
              <h2>Auto-Refresh Limit Reached</h2>
              <p>
                The page has auto-refreshed 15 times. Please reload the page to
                continue viewing updates.
              </p>
              <button
                className={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        )}

        {/* Booking Error Modal */}
        {bookingError && (
          <div
            className={styles.errorBackdrop}
            onClick={() => setBookingError(null)}
          >
            <div
              className={styles.errorModal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Booking Failed</h2>
              <p>{bookingError}</p>
              <button
                className={styles.closeErrorButton}
                onClick={() => setBookingError(null)}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Booking Success Modal */}
        {bookingSuccess && (
          <div className={styles.successBackdrop}>
            <div className={styles.successModal}>
              <div className={styles.successDetails}>
                <p className={styles.successText}>Confirmed</p>

                <div className={styles.confirmationNumber}>
                  <span className={styles.confirmationLabel}>
                    Confirmation Number:
                  </span>
                  <span className={styles.confirmationCode}>
                    {bookingSuccess}
                  </span>
                </div>

                <div className={styles.bookingInfo}>
                  <div className={styles.infoItem}>
                    <strong>Service:</strong> {service.serviceName}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Employee:</strong> {employee.firstName}{" "}
                    {employee.lastName}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Date:</strong>{" "}
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className={styles.infoItem}>
                    <strong>Time:</strong> {formatTo12Hour(selectedSlot)}
                  </div>
                </div>

                <p className={styles.successNote}>
                  A confirmation email has been sent to your registered email
                  address.
                </p>
              </div>

              <div className={styles.successButtons}>
                <button
                  className={styles.backToDashboardButton}
                  onClick={() => navigate("/bookings")}
                >
                  View in Bookings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityBookingPage;
