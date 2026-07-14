import styles from "./WelcomeBanner.module.css";

/**
 * WelcomeBanner — the wireframe's full-width rounded greeting strip.
 *
 * Props:
 *   name      string | null   partner's first name; falls back to "Partner"
 *   subtitle  string | null   e.g. business name or a helper line
 *   loading   boolean         renders a skeleton for the name line
 *   actions   node            optional right-aligned buttons (Export, New…)
 *
 * The greeting adapts to the local time of day — a small touch, but it
 * makes the dashboard feel alive without fabricating data.
 */
function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeBanner({ name, subtitle, loading = false, actions }) {
  return (
    <header className={styles.banner}>
      <div className={styles.textBlock}>
        {loading ? (
          <span className={styles.skeletonLine} aria-label="Loading greeting" />
        ) : (
          <h1 className={styles.title}>
            {getGreeting()}, {name || "Partner"}
          </h1>
        )}
        {!loading && subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
