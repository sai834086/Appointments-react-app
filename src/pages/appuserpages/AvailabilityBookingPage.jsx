import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAvailabilityToAppUser,
  getAvailableSlots,
  bookAppointment,
} from "../../api/userService";
import styles from "./AvailabilityBookingPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faDollarSign,
  faCalendarAlt,
  faCheckCircle,
  faInfoCircle,
  faChevronLeft,
  faChevronRight,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";

/* â”€â”€ helpers â”€â”€ */
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

function getInitials(firstName, lastName) {
  return ((firstName || "").charAt(0) + (lastName || "").charAt(0)).toUpperCase() || "?";
}

const DAY_NAMES_UPPER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_NAMES_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* â”€â”€ component â”€â”€ */
const AvailabilityBookingPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const service  = location.state?.service;
  const employee = location.state?.employee;

  const [availability,       setAvailability]       = useState(null);
  const [loading,            setLoading]             = useState(false);
  const [error,              setError]               = useState(null);
  const [currentDate,        setCurrentDate]         = useState(new Date());
  const [selectedDate,       setSelectedDate]        = useState(null);
  const [showCalendar,       setShowCalendar]        = useState(false);
  const [openTillDate,       setOpenTillDate]        = useState(null);
  const [availableSlots,     setAvailableSlots]      = useState(null);
  const [slotsLoading,       setSlotsLoading]        = useState(false);
  const [slotsError,         setSlotsError]          = useState(null);
  const [refreshCount,       setRefreshCount]        = useState(0);
  const [showRefreshLimit,   setShowRefreshLimit]    = useState(false);
  const [refreshCountdown,   setRefreshCountdown]    = useState(60);
  const [selectedSlot,       setSelectedSlot]        = useState(null);
  const [showConfirmation,   setShowConfirmation]    = useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState(30);
  const [bookingLoading,     setBookingLoading]      = useState(false);
  const [bookingError,       setBookingError]        = useState(null);
  const [bookingSuccess,     setBookingSuccess]      = useState(null);   // confirmation number string
  const [bookingDone,        setBookingDone]         = useState(false);  // controls success modal
  const [successCountdown,   setSuccessCountdown]    = useState(5);

  /* â”€â”€ fetch availability on mount â”€â”€ */
  useEffect(() => {
    if (!employee) { navigate(-1); return; }
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const res  = await getAvailabilityToAppUser(employee.employeeId);
        const avail = res.data?.data?.employeeAvailability;
        setAvailability(avail);

        let cutoff = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (avail?.appointmentsOpenTillInMonths) {
          const today = new Date();
          cutoff = new Date(today.getFullYear(), today.getMonth() + avail.appointmentsOpenTillInMonths, today.getDate());
        }
        setOpenTillDate(cutoff);

        const today = new Date();
        let firstAvail = null;
        for (let i = 0; i <= 7; i++) {
          const d = new Date(today); d.setDate(today.getDate() + i);
          if (avail?.availableDays?.includes(DAY_NAMES_UPPER[d.getDay()]) && d <= cutoff) {
            firstAvail = d; break;
          }
        }
        if (firstAvail) {
          setSelectedDate(firstAvail);
          try {
            const sr = await getAvailableSlots(service.serviceId, employee.employeeId, firstAvail);
            setAvailableSlots(sr.data?.data?.availableSlots);
          } catch { /* ignore */ }
        }
      } catch { setError("Failed to load availability."); }
      finally { setLoading(false); }
    };
    run();
  }, [employee, service, navigate]);

  /* â”€â”€ fetch slots when date changes â”€â”€ */
  useEffect(() => {
    if (!selectedDate || !service || !employee) return;
    setSlotsLoading(true); setSlotsError(null);
    const run = async () => {
      try {
        const r = await getAvailableSlots(service.serviceId, employee.employeeId, selectedDate);
        setAvailableSlots(r.data?.data?.availableSlots);
      } catch { setSlotsError("Failed to load slots."); }
      finally { setSlotsLoading(false); }
    };
    run();
  }, [selectedDate, service, employee]);

  /* â”€â”€ auto-refresh â”€â”€ */
  useEffect(() => {
    if (!selectedDate || !service || !employee || refreshCount >= 15) return;
    setRefreshCountdown(60);
    const iv = setInterval(() => {
      setRefreshCount(p => { const n = p + 1; if (n >= 15) { setShowRefreshLimit(true); clearInterval(iv); } return n; });
      setRefreshCountdown(60);
      (async () => {
        try { const r = await getAvailableSlots(service.serviceId, employee.employeeId, selectedDate); setAvailableSlots(r.data?.data?.availableSlots); } catch { /* ignore */ }
      })();
    }, 60000);
    return () => clearInterval(iv);
  }, [selectedDate, service, employee, refreshCount]);

  /* â”€â”€ countdown â”€â”€ */
  useEffect(() => {
    if (!selectedDate || refreshCount >= 15) return;
    const iv = setInterval(() => setRefreshCountdown(p => p <= 1 ? 60 : p - 1), 1000);
    return () => clearInterval(iv);
  }, [selectedDate, refreshCount]);

  /* â”€â”€ confirmation countdown â”€â”€ */
  useEffect(() => {
    if (!showConfirmation) return;
    setConfirmationCountdown(30);
    const iv = setInterval(() => setConfirmationCountdown(p => { if (p <= 1) { setShowConfirmation(false); return 30; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [showConfirmation]);

  /* â”€â”€ success: countdown then reload â”€â”€ */
  useEffect(() => {
    if (!bookingDone) return;
    setSuccessCountdown(10);
    const iv = setInterval(() => {
      setSuccessCountdown(p => {
        if (p <= 1) { clearInterval(iv); window.location.reload(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [bookingDone]);

  /* â”€â”€ calendar helpers â”€â”€ */
  const isAvailableDay = (date) =>
    availability?.availableDays?.includes(DAY_NAMES_UPPER[date.getDay()]) ?? false;

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const total    = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    return days;
  };

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const calDays    = generateCalendarDays();

  const today = new Date(); today.setHours(0,0,0,0);

  /* â”€â”€ early returns â”€â”€ */
  if (!service || !employee) {
    return (
        <div className={styles.pageWrapper}><div className={styles.errorMsg}>No employee or service selected.</div></div>
          );
  }

  const empName  = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const svcName  = service.name || service.serviceName || "";
  const duration = service.eachServiceTimeInMinus || service.duration;
  const fee      = service.serviceFee ?? service.price;

  /* â”€â”€ render â”€â”€ */
  return (
    <div className={styles.pageWrapper}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className={styles.pageTitle}>Select Date &amp; Time</h1>
        </div>

        {/* Summary card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCol}>
            <p className={styles.summaryLabel}>SERVICE</p>
            <p className={styles.summaryName}>{svcName}</p>
            <div className={styles.summaryMeta}>
              {duration > 0 && (
                <span className={styles.metaChip}><FontAwesomeIcon icon={faClock} />{duration} mins</span>
              )}
              {fee != null && (
                <span className={`${styles.metaChip} ${styles.metaFee}`}><FontAwesomeIcon icon={faDollarSign} />{parseFloat(fee).toFixed(2)}</span>
              )}
            </div>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryCol}>
            <p className={styles.summaryLabel}>STAFF</p>
            <p className={styles.summaryName}>{empName}</p>
            {employee.email && <p className={styles.summarySubtext}>{employee.email}</p>}
          </div>
        </div>

        {/* Booking window banner */}
        {!loading && availability?.appointmentsOpenTillInMonths > 0 && (() => {
          const months = availability.appointmentsOpenTillInMonths;
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() + months);
          const cutoffStr = cutoff.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          return (
      <div className={styles.bookingWindowBanner}>
              <div className={styles.bookingWindowIcon}>
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <div className={styles.bookingWindowText}>
                <span className={styles.bookingWindowTitle}>
                  Book up to {months} {months === 1 ? "month" : "months"} in advance
                </span>
                <span className={styles.bookingWindowSub}>
                  Appointments are available until <strong>{cutoffStr}</strong>
                </span>
              </div>
            </div>
          );
        })()}

        {/* Loading / error */}
        {loading && <div className={styles.loadingState}>Loading availabilityâ€¦</div>}
        {error   && <div className={styles.errorMsg}>{error}</div>}

        {/* Date picker row */}
        {!loading && availability && (
          <div className={styles.dateRow}>
            <div className={styles.dateRowLeft}>
              <FontAwesomeIcon icon={faCalendarAlt} className={styles.dateIcon} />
              <div>
                <p className={styles.dateRowLabel}>Selected Date</p>
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

        {/* Time slots */}
        {!loading && selectedDate && (
          <div className={styles.slotsSection}>
            <div className={styles.slotsSectionHeader}>
              <h2 className={styles.slotsTitle}>Available Time Slots</h2>
              {refreshCount < 15 && (
                <span className={styles.refreshLabel}>
                  <FontAwesomeIcon icon={faInfoCircle} />
                  Refreshes in {refreshCountdown}s &nbsp;({refreshCount}/15)
                </span>
              )}
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
                  const d = new Date(date); d.setHours(0,0,0,0);
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
              <h2 className={styles.modalTitle}>Confirm Booking</h2>
              <div className={styles.modalRows}>
                {[
                  ["Service",   svcName],
                  ["Staff",     empName],
                  ["Date",      selectedDate?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })],
                  ["Time",      formatTo12Hour(selectedSlot)],
                ].map(([label, val]) => (
                  <div key={label} className={styles.modalRow}>
                    <span className={styles.modalLabel}>{label}</span>
                    <span className={`${styles.modalVal} ${label === "Time" ? styles.modalValHighlight : ""}`}>{val}</span>
                  </div>
                ))}
              </div>
              <div className={styles.modalBtns}>
                <button className={styles.modalCancelBtn} onClick={() => setShowConfirmation(false)}>
                  Close&nbsp;<span className={styles.closeCd}>({confirmationCountdown}s)</span>
                </button>
                <button
                  className={styles.modalConfirmBtn}
                  disabled={bookingLoading}
                  onClick={async () => {
                    setBookingLoading(true); setBookingError(null);
                    try {
                      // Build a local YYYY-MM-DD string so timezone offsets don't shift the date.
                      // toISOString() converts to UTC, which for zones ahead of UTC (e.g. IST)
                      // flips the calendar day backwards and makes the backend look up the wrong
                      // weekday's Availability row.
                      const yyyy = selectedDate.getFullYear();
                      const mm   = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const dd   = String(selectedDate.getDate()).padStart(2, "0");
                      const localDateStr = `${yyyy}-${mm}-${dd}`;
                      const r = await bookAppointment({ employeeId: employee.employeeId, serviceId: service.serviceId, date: localDateStr, startTime: selectedSlot });
                      // Extract confirmation number â€” handle different possible key names
                      const data = r.data?.data ?? r.data ?? {};
                      const confNum =
                        data["confirmation number"] ??
                        data["confirmationNumber"] ??
                        data["confirmation_number"] ??
                        data["confirmationNo"] ??
                        data["id"] ??
                        null;
                      setBookingSuccess(confNum);
                      setBookingDone(true);
                      setShowConfirmation(false);
                    } catch (err) {
                      setBookingError(err.response?.data?.message || "Failed to book appointment");
                    } finally { setBookingLoading(false); }
                  }}
                >
                  {bookingLoading ? "Processingâ€¦" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Refresh limit modal â”€â”€ */}
        {showRefreshLimit && (
          <div className={styles.backdrop}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Refresh Limit Reached</h2>
              <p className={styles.modalBody}>Slots have auto-refreshed 15 times. Please reload to continue.</p>
              <div className={styles.modalBtns}>
                <button className={styles.modalConfirmBtn} onClick={() => window.location.reload()}>Reload Page</button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Booking error modal â”€â”€ */}
        {bookingError && (
          <div className={styles.backdrop} onClick={() => setBookingError(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Booking Failed</h2>
              <p className={styles.modalBody}>{bookingError}</p>
              <div className={styles.modalBtns}>
                <button className={styles.modalConfirmBtn} onClick={() => setBookingError(null)}>Try Again</button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ Booking success modal â”€â”€ */}
        {bookingDone && (
          <div className={styles.backdrop}>
            <div className={styles.successModal}>
              <div className={styles.successIconWrap}>
                <FontAwesomeIcon icon={faCheckCircle} className={styles.successIcon} />
              </div>
              <h2 className={styles.successTitle}>Booking Confirmed!</h2>
              {bookingSuccess && (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmBoxLabel}>Confirmation Number</p>
                  <p className={styles.confirmBoxCode}>{bookingSuccess}</p>
                </div>
              )}
              <p className={styles.emailNote}>
                A confirmation email has been sent to your registered email address.
              </p>
              <div className={styles.successRows}>
                {[
                  ["Service", svcName],
                  ["Staff",   empName],
                  ["Date",    selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
                  ["Time",    formatTo12Hour(selectedSlot)],
                ].map(([label, val]) => (
                  <div key={label} className={styles.successRow}>
                    <span className={styles.successRowLabel}>{label}</span>
                    <span className={styles.successRowVal}>{val}</span>
                  </div>
                ))}
              </div>
              <button
                className={styles.successCloseBtn}
                onClick={() => window.location.reload()}
              >
                Close&nbsp;<span className={styles.successCloseCd}>({successCountdown}s)</span>
              </button>
            </div>
          </div>
        )}

      </div>
  );
};

export default AvailabilityBookingPage;



