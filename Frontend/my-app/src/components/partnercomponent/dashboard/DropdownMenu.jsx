import { useState } from "react";
import styles from "./DropdownMenu.module.css";
import { Check } from "lucide-react";

/**
 * DropdownMenu — compact icon-button + single-select menu, used for the
 * Filter and Sort controls in section headers.
 *
 * Props:
 *   icon      LucideIcon    button icon
 *   label     string        accessible name + title (e.g. "Filter by status")
 *   options   [{ key, label }]
 *   value     string        currently selected option key
 *   onSelect  (key) => void
 *   active    boolean       highlights the button (a non-default selection)
 */
export default function DropdownMenu({ icon: Icon, label, options, value, onSelect, active }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.trigger} ${active ? styles.triggerActive : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
      >
        <Icon size={15} strokeWidth={2.25} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={styles.menu} role="menu" aria-label={label}>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.key}
                className={`${styles.item} ${value === option.key ? styles.itemActive : ""}`}
                onClick={() => {
                  onSelect(option.key);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {value === option.key && (
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
