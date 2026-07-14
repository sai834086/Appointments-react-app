import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./Availability.module.css";

const Availability = ({ availability, appointmentsOpenTillInMonths }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [dayAvailability, setDayAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const updateDayAvailability = useCallback(
    (date) => {
      const weekday = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase();
      const dayData = availability.find((a) => a.day === weekday);
      setDayAvailability(dayData);
    },
    [availability]
  );

  useEffect(() => {
    updateDayAvailability(selectedDate);
  }, [selectedDate, availability, updateDayAvailability]);

  const parseTime = (timeStr) => {
    const [h, m, s] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0, 0);
    return date;
  };

  const isDateAvailable = (date) => {
    const weekday = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
    const dayData = availability.find((a) => a.day === weekday);
    return dayData && dayData.isAvailable !== "UNAVAILABILE";
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + (appointmentsOpenTillInMonths || 3));
    return maxDate;
  };

  const generateTimeSlots = () => {
    if (!dayAvailability || dayAvailability.isAvailable === "UNAVAILABILE")
      return [];

    const slots = [];
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    let current = parseTime(dayAvailability.openTime);

    // If it's today, start from current time or next available slot
    if (isToday) {
      const currentTime = new Date();
      currentTime.setSeconds(0, 0); // Round to minute
      current = current > currentTime ? current : currentTime;

      // Round up to next interval
      const interval = dayAvailability.eachAppointmentTimeInMinus || 60;
      const minutes = current.getMinutes();
      const remainder = minutes % interval;
      if (remainder !== 0) {
        current.setMinutes(minutes + (interval - remainder));
      }
    }

    const close = parseTime(dayAvailability.closeTime);
    const interval = dayAvailability.eachAppointmentTimeInMinus || 60;

    while (current < close) {
      const slotEnd = new Date(current.getTime() + interval * 60000);

      const isOffTime = dayAvailability.offTimes.some((ot) => {
        const offStart = parseTime(ot.offTimeFrom);
        const offEnd = parseTime(ot.offTimeTo);
        return current < offEnd && slotEnd > offStart;
      });

      if (!isOffTime) {
        const timeString = current.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        slots.push(timeString);
      }
      current = slotEnd;
    }

    return slots;
  };

  return (
    <div className={styles.availabilityWrapper}>
      <div className={styles.header}>
        <h3>Availability for {selectedDate.toDateString()}</h3>
        <button onClick={() => setShowCalendar(!showCalendar)}>📅</button>
      </div>

      {showCalendar && (
        <div className={styles.calendarContainer}>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setShowCalendar(false);
              setSelectedSlot(null);
            }}
            inline
            minDate={new Date()}
            maxDate={getMaxDate()}
            filterDate={isDateAvailable}
          />
        </div>
      )}

      {!dayAvailability || dayAvailability.isAvailable === "UNAVAILABILE" ? (
        <div className={styles.unavailableText}>
          No availability for this day.
        </div>
      ) : (
        <div className={styles.availabilityContent}>
          <div className={styles.scheduleInfo}>
            <p>
              <strong>Open:</strong>{" "}
              {parseTime(dayAvailability.openTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p>
              <strong>Close:</strong>{" "}
              {parseTime(dayAvailability.closeTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p>
              <strong>Appointment Duration:</strong>{" "}
              {dayAvailability.eachAppointmentTimeInMinus || 60} minutes
            </p>
          </div>

          <h4>Available Time Slots</h4>
          {generateTimeSlots().length === 0 ? (
            <p className={styles.noSlots}>No available slots for this day.</p>
          ) : (
            <div className={styles.slotsContainer}>
              {generateTimeSlots().map((slot, index) => (
                <button
                  key={index}
                  className={`${styles.slotButton} ${
                    selectedSlot === slot ? styles.selectedSlot : ""
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className={styles.selectedInfo}>
          Selected Time Slot: <strong>{selectedSlot}</strong>
        </div>
      )}
    </div>
  );
};

export default Availability;
