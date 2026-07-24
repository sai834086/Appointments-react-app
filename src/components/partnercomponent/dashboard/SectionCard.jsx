import styles from "./SectionCard.module.css";

/**
 * SectionCard — the rounded surface every dashboard block sits on.
 *
 * Props:
 *   title     string | node     section heading (rendered as <h2>)
 *   count     number            optional badge next to the title
 *   actions   node              optional right-aligned header actions
 *   children  node              card body
 *   className string            extra class for layout (grid spans etc.)
 *
 * Renders a native <section> with an accessible heading so screen-reader
 * users can jump between dashboard regions.
 */
export default function SectionCard({
  title,
  count,
  actions,
  children,
  className = "",
  ...rest
}) {
  return (
    <section className={`${styles.card} ${className}`} {...rest}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && (
            <h2 className={styles.title}>
              {title}
              {typeof count === "number" && (
                <span className={styles.countBadge}>{count}</span>
              )}
            </h2>
          )}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
