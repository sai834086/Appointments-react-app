import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAvailabilityToAppUser } from "../../api/userService";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./AvailabilityBookingPage.module.css";
import { Calendar } from "lucide-react";

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
        if (employeeAvailability?.appointmentsOpenTillInMonths) {
          const today = new Date();
          const cutoffDate = new Date(
            today.getFullYear(),
            today.getMonth() +
              employeeAvailability.appointmentsOpenTillInMonths,
            today.getDate() // Same day, N months later
          );
          setOpenTillDate(cutoffDate);
          console.log("Cutoff Date (3 months from today):", cutoffDate);
        }
      } catch (err) {
        setError("Failed to load availability");
        console.error("Error fetching availability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [employee, navigate]);

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
                          onClick={() => canBook && setSelectedDate(date)}
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
                <button className={styles.proceedBtn}>Continue to Book</button>
              </div>
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
      </div>
    </div>
  );
};

export default AvailabilityBookingPage;
