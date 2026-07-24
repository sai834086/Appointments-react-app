import { useState } from "react";
import SectionCard from "./SectionCard";
import StatCircle from "./StatCircle";
import DropdownMenu from "./DropdownMenu";
import styles from "./AppointmentsOverview.module.css";
import {
  RefreshCw,
  MoreHorizontal,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/**
 * AppointmentsOverview — the Appointments card:
 *
 *   Appointments · Today                       [...]
 *      ( All Bookings: N )       Booked     [n]
 *                                Completed  [n]
 *                                Cancelled  [n]
 *
 * The "..." menu switches the period (Today / This Month / This Year); the
 * whole card — total circle and status tiles — reflects the selection.
 * The choice is component-local and NOT persisted: every dashboard visit
 * starts back on Today.
 *
 * Props:
 *   stats    { TODAY, MONTH, YEAR } — each { total, booked, completed,
 *            cancelled } (nulls on older backend builds), or null if that
 *            period's fetch failed
 *   loading  boolean
 *   error    string | null — whole-card failure (all periods failed)
 *   onRetry  () => void
 */

const PERIOD_OPTIONS = [
  { key: "TODAY", label: "Today" },
  { key: "MONTH", label: "This Month" },
  { key: "YEAR", label: "This Year" },
];

const STATUS_ROWS = [
  { key: "booked", label: "Booked", icon: CalendarCheck2, tone: "toneBooked" },
  { key: "completed", label: "Completed", icon: CheckCircle2, tone: "toneCompleted" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, tone: "toneCancelled" },
];

const format = (value) => (value == null ? "—" : Number(value).toLocaleString());

function StatusList({ period, loading }) {
  return (
    <ul className={styles.statusList} aria-busy={loading}>
      {STATUS_ROWS.map(({ key, label, icon: Icon, tone }) => (
        <li key={key} className={styles.statusRow}>
          <span className={`${styles.statusIcon} ${styles[tone]}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2.25} />
          </span>
          <span className={styles.statusLabel}>{label}</span>
          {loading ? (
            <span className={styles.statusSkeleton} aria-label={`${label}: loading`} />
          ) : (
            <span className={styles.statusValue}>{format(period?.[key])}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AppointmentsOverview({ stats, loading, error, onRetry }) {
  // Resets to Today on every mount — i.e. on every dashboard visit.
  const [periodKey, setPeriodKey] = useState("TODAY");

  const periodLabel = PERIOD_OPTIONS.find((o) => o.key === periodKey)?.label ?? "Today";
  const period = stats?.[periodKey];

  return (
    <SectionCard
      title={`Appointments · ${periodLabel}`}
      aria-label="Appointment counts"
      actions={
        !error && (
          <DropdownMenu
            icon={MoreHorizontal}
            label="Change period"
            options={PERIOD_OPTIONS}
            value={periodKey}
            onSelect={setPeriodKey}
            active={periodKey !== "TODAY"}
          />
        )
      }
    >
      {error && !loading ? (
        <div className={styles.errorState} role="alert">
          <p className={styles.errorText}>{error}</p>
          {onRetry && (
            <button type="button" className={styles.retryButton} onClick={onRetry}>
              <RefreshCw size={14} strokeWidth={2.25} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      ) : (
        <div className={styles.todayRow} key={periodKey}>
          <StatCircle
            value={period?.total}
            label="All Bookings"
            loading={loading}
            error={!loading && period?.total == null}
            unit="appointments"
          />
          <StatusList period={period} loading={loading} />
        </div>
      )}
    </SectionCard>
  );
}
