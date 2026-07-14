import SectionCard from "./SectionCard";
import StatCircle from "./StatCircle";
import styles from "./TotalsPanel.module.css";

/**
 * TotalsPanel — the wireframe's right-hand box: one sub-box per portfolio
 * total (Properties / Services / Employees). Each sub-box shows the label +
 * total in its header and, when the entity tracks a status, two small
 * Active / Inactive circles beneath.
 *
 * Props:
 *   items    [{
 *     key       string
 *     label     string               e.g. "Properties"
 *     total     number | null        null → em-dash (failed fetch)
 *     icon      LucideIcon           optional
 *     breakdown { active, inactive } | null — null hides the circles
 *                                    (e.g. Services have no status column)
 *   }]
 *   loading  boolean — skeletons in place of numbers and circles
 */
export default function TotalsPanel({ items, loading = false }) {
  return (
    <SectionCard title="Overview" aria-label="Portfolio totals">
      <div className={styles.boxGrid} aria-busy={loading}>
        {items.map(({ key, label, total, icon: Icon, breakdown }) => (
          <section key={key} className={styles.box} aria-label={label}>
            <header className={styles.boxHeader}>
              <span className={styles.labelWrap}>
                {Icon && (
                  <span className={styles.iconWrap} aria-hidden="true">
                    <Icon size={15} strokeWidth={2} />
                  </span>
                )}
                <h3 className={styles.boxLabel}>{label}</h3>
              </span>
              {loading ? (
                <span className={styles.skeleton} aria-label={`${label}: loading`} />
              ) : (
                <span className={styles.boxTotal}>
                  {total == null ? "—" : Number(total).toLocaleString()}
                </span>
              )}
            </header>

            {breakdown ? (
              <div className={styles.circlePair}>
                <StatCircle
                  size="sm"
                  label="Active"
                  value={breakdown.active}
                  loading={loading}
                  error={!loading && breakdown.active == null}
                />
                <StatCircle
                  size="sm"
                  label="Inactive"
                  value={breakdown.inactive}
                  loading={loading}
                  error={!loading && breakdown.inactive == null}
                />
              </div>
            ) : (
              <p className={styles.noBreakdown}>Status isn&apos;t tracked for {label.toLowerCase()}.</p>
            )}
          </section>
        ))}
      </div>
    </SectionCard>
  );
}
