import styles from "./StatCircle.module.css";

/**
 * StatCircle — a number inside a circle with a label chip below.
 *
 * Props:
 *   value    number | null
 *   label    string
 *   loading  boolean — pulsing skeleton circle (announced via aria-busy)
 *   error    boolean — em-dash with an explanatory tooltip/aria-label
 *   size     "md" (default, 96px — hero stats) | "sm" (56px — breakdowns)
 *   unit     string — appended to the screen-reader readout ("appointments")
 */
export default function StatCircle({
  value,
  label,
  loading = false,
  error = false,
  size = "md",
  unit = "",
}) {
  const unavailable = !loading && (error || value == null);
  const display = loading ? "" : unavailable ? "—" : Number(value).toLocaleString();

  const readout = loading
    ? `${label}: loading`
    : unavailable
      ? `${label}: unavailable`
      : `${label}: ${display}${unit ? ` ${unit}` : ""}`;

  const sizeClass = size === "sm" ? styles.blockSm : "";

  return (
    <div
      className={`${styles.block} ${sizeClass}`}
      role="group"
      aria-label={readout}
      aria-busy={loading}
    >
      <div
        className={`${styles.circle} ${loading ? styles.circleLoading : ""} ${
          unavailable ? styles.circleError : ""
        }`}
        title={unavailable ? "Couldn't load this number" : undefined}
      >
        {!loading && <span className={styles.value}>{display}</span>}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
