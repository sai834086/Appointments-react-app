import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAvailabilityToAppUser,
  getAvailableSlots,
  rescheduleAppointment,
} from "../../api/userService";
import styles from "./AvailabilityBookingPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarAlt,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const DAY_NAMES_UPPER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_NAMES_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatTo12Hour(time24) {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function RescheduleBookingPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  const booking = location.state?.booking;

  const [availability,        setAvailability]        = useState(null);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState(null);
  const [currentDate,         setCurrentDate]         = useState(new Date());
  const [selectedDate,        setSelectedDate]        = useState(null);
  const [showCalendar,        setShowCalendar]        = useState(false);
  const [openTillDate,        setOpenTillDate]        = useState(null);
  const [availableSlots,      setAvailableSlots]      = useState(null);
  const [slotsLoading,        setSlotsLoading]        = useState(false);
  const [slotsError,          setSlotsError]          = useState(null);
  const [selectedSlot,        setSelectedSlot]        = useState(null);
  const [showConfirmation,    setShowConfirmation]    = useState(false);
  const [confirmCountdown,    setConfirmCountdown]    = useState(30);
  const [rescheduling,        setRescheduling]        = useState(false);
  const [rescheduleError,     setRescheduleError]     = useState(null);
  const [rescheduleSuccess,   setRescheduleSuccess]   = useState(false);
  const [successCountdown,    setSuccessCountdown]    = useState(5);

  // â”€â”€ Guard: redirect if no booking context â”€â”€
  useEffect(() => {
    if (!booking) navigate(-1);
  }, [booking, navigate]);

  // â”€â”€ Fetch availability on mount â”€â”€
  useEffect(() => {
    if (!booking) return;
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const res   = await getAvailabilityToAppUser(booking.employeeId);
        const avail = res.data?.data?.["employee availability"] ?? res.data?.data?.employeeAvailability;
        setAvailability(avail);

        let cutoff = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (avail?.appointmentsOpenTillInMonths) {
          const t = new Date();
          cutoff  = new Date(t.getFullYear(), t.getMonth() + avail.appointmentsOpenTillInMonths, t.getDate());
        }
        setOpenTillDate(cutoff);

        // Try current booking date first, otherwise first available in next 7 days
        const today           = new Date(); today.setHours(0,0,0,0);
        const currentBookDate = new Date(booking.appointmentDate); currentBookDate.setHours(0,0,0,0);
        const currentDayName  = DAY_NAMES_UPPER[currentBookDate.getDay()];

        let dateToSelect = null;
        if (
          currentBookDate >= today &&
          currentBookDate <= cutoff &&
          avail?.availableDays?.includes(currentDayName)
        ) {
          dateToSelect = currentBookDate;
        } else {
          for (let i = 0; i <= 14; i++) {
            const d = new Date(today); d.setDate(today.getDate() + i);
            if (avail?.availableDays?.includes(DAY_NAMES_UPPER[d.getDay()]) && d <= cutoff) {
              dateToSelect = d; break;
            }
          }
        }

        if (dateToSelect) {
          setSelectedDate(dateToSelect);
          try {
            const sr = await getAvailableSlots(booking.serviceId, booking.employeeId, dateToSelect);
            setAvailableSlots(sr.data?.data?.["Availabile Slots"] ?? sr.data?.data?.availableSlots);
          } catch { /* ignore â€” shown in slots area */ }
        }
      } catch { setError("Failed to load availability. Please try again."); }
      finally { setLoading(false); }
    };
    run();
  }, [booking]);

  // â”€â”€ Fetch slots when date changes â”€â”€
  useEffect(() => {
    if (!selectedDate || !booking) return;
    setSlotsLoading(true); setSlotsError(null); setSelectedSlot(null);
    const run = async () => {
      try {
        const r    = await getAvailableSlots(booking.serviceId, booking.employeeId, selectedDate);
        const data = r.data?.data?.["Availabile Slots"] ?? r.data?.data?.availableSlots;
        setAvailableSlots(data);
      } catch { setSlotsError("Failed to load available times."); }
      finally { setSlotsLoading(false); }
    };
    run();
  }, [selectedDate, booking]);

  // â”€â”€ Confirmation countdown â”€â”€
  useEffect(() => {
    if (!showConfirmation) return;
    setConfirmCountdown(30);
    const iv = setInterval(() => {
      setConfirmCountdown(p => {
        if (p <= 1) { setShowConfirmation(false); return 30; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [showConfirmation]);

  // â”€â”€ Success: countdown then redirect â”€â”€
  useEffect(() => {
    if (!rescheduleSuccess) return;
    setSuccessCountdown(5);
    const iv = setInterval(() => {
      setSuccessCountdown(p => {
        if (p <= 1) {
          clearInterval(iv);
          navigate("/bookings", { state: { rescheduledBookingId: booking?.appointmentId } });
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [rescheduleSuccess, navigate, booking]);

  // â”€â”€ Calendar helpers â”€â”€
  const isAvailableDay = (date) =>
    availability?.availableDays?.includes(DAY_NAMES_UPPER[date.getDay()]) ?? false;

  const generateCalendarDays = () => {
    const days     = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const total    = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    return days;
  };

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const today      = new Date(); today.setHours(0,0,0,0);
  const calDays    = generateCalendarDays();

  // â”€â”€ Handle reschedule confirm â”€â”€
  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setRescheduling(true); setRescheduleError(null);
    try {
      const yyyy = selectedDate.getFullYear();
      const mm   = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd   = String(selectedDate.getDate()).padStart(2, "0");
      await rescheduleAppointment({
        appointmentId: booking.appointmentId,
        date:          `${yyyy}-${mm}-${dd}`,
        startTime:     selectedSlot,
      });
      setShowConfirmation(false);
      setRescheduleSuccess(true);
    } catch (err) {
      setRescheduleError(
        err.response?.data?.message || "Failed to reschedule. Please try again."
      );
    } finally { setRescheduling(false); }
  };

  if (!booking) return null;

  const svcName  = booking.serviceName  || "Service";
  const empName  = booking.employeeName || "Staff";

  return (
    <div className={styles.pageWrapper}>

        {/* â”€â”€ Top bar â”€â”€ */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className={styles.pageTitle}>Reschedule Booking</h1>
        </div>

        {/* â”€â”€ Summary card (service / staff) â”€â”€ */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCol}>
            <p className={styles.summaryLabel}>SERVICE</p>
            <p className={styles.summaryName}>{svcName}</p>
            <p className={styles.summarySubtext}>
              Currently: {formatDateShort(booking.appointmentDate)} at {formatTo12Hour(booking.startTime)}
            </p>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryCol}>
            <p className={styles.summaryLabel}>STAFF</p>
            <p className={styles.summaryName}>{empName}</p>
          </div>
        </div>

        {/* â”€â”€ Loading / error â”€â”€ */}
        {loading && <div className={styles.loadingState}>Loading availabilityâ€¦</div>}
        {error   && <div className={styles.errorMsg}>{error}</div>}

        {/* â”€â”€ Date picker row â”€â”€ */}
        {!loading && availability && (
          <div className={styles.dateRow}>
            <div className={styles.dateRowLeft}>
              <FontAwesomeIcon icon={faCalendarAlt} className={styles.dateIcon} />
              <div>
                <p className={styles.dateRowLabel}>New Date</p>
                <p className={styles.dateRowValue}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                    : "No date selected"}
                </p>
              </div>
            </div>
            <button className={styles.changeDateBtn} onClick={() => setShowCalendar(true)}>
              Change
            </button>
          </div>
        )}

        {/* â”€â”€ Time slots â”€â”€ */}
        {!loading && selectedDate && (
          <div className={styles.slotsSection}>
            <div className={styles.slotsSectionHeader}>
              <h2 className={styles.slotsTitle}>Available Time Slots</h2>
            </div>

            {slotsLoading ? (
              <div className={styles.loadingState}>Loading slotsâ€¦</div>
            ) : slotsError ? (
              <div className={styles.errorMsg}>{slotsError}</div>
            ) : availableSlots?.availabileSlots?.length > 0 ? (
              <div className={styles.slotsGrid}>
                {availableSlots.availabileSlots.map((slot, i) => (
                  <button
                    key={i}
                    className={`${styles.slotBtn} ${selectedSlot === slot ? styles.slotBtnActive : ""}`}
                    onClick={() => { setSelectedSlot(slot); setShowConfirmation(true); }}
                  >
                    {formatTo12Hour(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.noSlots}>No available slots for this date.</div>
            )}
          </div>
        )}

        {/* â”€â”€ Calendar modal â”€â”€ */}
        {showCalendar && (
          <div className={styles.backdrop} onClick={() => setShowCalendar(false)}>
            <div className={styles.calModal} onClick={e => e.stopPropagation()}>
              <div className={styles.calHeader}>
                <button className={styles.calNavBtn} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className={styles.calMonthLabel}>{monthLabel}</span>
                <button
                  className={styles.calNavBtn}
                  onClick={() => {
                    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
                    if (!openTillDate || next <= openTillDate) setCurrentDate(next);
                  }}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              <div className={styles.calWeekRow}>
                {DAY_NAMES_SHORT.map(d => <div key={d} className={styles.calWeekDay}>{d}</div>)}
              </div>

              <div className={styles.calGrid}>
                {calDays.map((date, i) => {
                  if (!date) return <div key={`e${i}`} />;
                  const d       = new Date(date); d.setHours(0,0,0,0);
                  const avail   = isAvailableDay(d);
                  const isPast  = d < today;
                  const isOver  = openTillDate && d > openTillDate;
                  const isToday = d.getTime() === today.getTime();
                  const isSel   = selectedDate && d.toDateString() === selectedDate.toDateString();
                  const canBook = avail && !isPast && !isOver;
                  return (
                    <button
                      key={d.toISOString()}
                      className={[
                        styles.calDay,
                        canBook  ? styles.calDayAvail    : "",
                        isSel    ? styles.calDaySelected : "",
                        isToday  ? styles.calDayToday    : "",
                        !canBook ? styles.calDayDisabled : "",
                      ].join(" ")}
                      onClick={() => { if (canBook) { setSelectedDate(d); setShowCalendar(false); } }}
                      disabled={!canBook}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <button className={styles.calCloseBtn} onClick={() => setShowCalendar(false)}>Close</button>
            </div>
          </div>
        )}

        {/* â”€â”€ Confirmation modal â”€â”€ */}
        {showConfirmation && selectedSlot && (
          <div className={styles.backdrop} onClick={() => setShowConfirmation(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Confirm Reschedule</h2>

              {/* From â†’ To comparison */}
              <div className={styles.rescheduleComparison}>
                <div className={styles.rescheduleBox}>
                  <p className={styles.rescheduleBoxLabel}>Current</p>
                  <p className={styles.rescheduleBoxDate}>{formatDateShort(booking.appointmentDate)}</p>
                  <p className={styles.rescheduleBoxTime}>{formatTo12Hour(booking.startTime)}</p>
                </div>
                <div className={styles.rescheduleArrow}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
                <div className={`${styles.rescheduleBox} ${styles.rescheduleBoxNew}`}>
                  <p className={styles.rescheduleBoxLabel}>New</p>
                  <p className={styles.rescheduleBoxDate}>
                    {selectedDate?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className={styles.rescheduleBoxTime}>{formatTo12Hour(selectedSlot)}</p>
                </div>
              </div>

              <div className={styles.modalRows}>
                {[
                  ["Service", svcName],
                  ["Staff",   empName],
                ].map(([label, val]) => (
                  <div key={label} className={styles.modalRow}>
                    <span className={styles.modalLabel}>{label}</span>
                    <span className={styles.modalVal}>{val}</span>
                  </div>
                ))}
              </div>

              {rescheduleError && (
                <div className={styles.errorMsg} style={{ marginBottom: "0.75rem" }}>
                  {rescheduleError}
                </div>
              )}

              <div className={styles.modalBtns}>
                <button
                  className={styles.modalCancelBtn}
                  onClick={() => setShowConfirmation(false)}
                  disabled={rescheduling}
                >
                  Close&nbsp;<span className={styles.closeCd}>({confirmCountdown}s)</span>
                </button>
                <button
                  className={styles.modalConfirmBtn}
                  onClick={handleConfirmReschedule}
                  disabled={rescheduling}
                >
                  {rescheduling ? "Reschedulingâ€¦" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Success modal â”€â”€ */}
        {rescheduleSuccess && (
          <div className={styles.backdrop}>
            <div className={styles.successModal}>
              <div className={styles.successIconWrap}>
                <FontAwesomeIcon icon={faCheckCircle} className={styles.successIcon} />
              </div>
              <h2 className={styles.successTitle}>Rescheduled!</h2>
              <p className={styles.emailNote}>
                Your appointment has been successfully rescheduled.
              </p>
              <div className={styles.successRows}>
                {[
                  ["Service", svcName],
                  ["Staff",   empName],
                  ["New Date", selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
                  ["New Time", formatTo12Hour(selectedSlot)],
                ].map(([label, val]) => (
                  <div key={label} className={styles.successRow}>
                    <span className={styles.successRowLabel}>{label}</span>
                    <span className={styles.successRowVal}>{val}</span>
                  </div>
                ))}
              </div>
              <button
                className={styles.successCloseBtn}
                onClick={() => navigate("/bookings", { state: { rescheduledBookingId: booking?.appointmentId } })}
              >
                Go to Bookings&nbsp;<span className={styles.successCloseCd}>({successCountdown}s)</span>
              </button>
            </div>
          </div>
        )}

      </div>
  );
}


