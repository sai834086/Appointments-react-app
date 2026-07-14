import { useState } from "react";
import PartnerSidebar from "./PartnerSidebar";
import styles from "./PartnerLayout.module.css";

export default function PartnerLayout({ children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.LayoutShell}>
      <PartnerSidebar expanded={expanded} onExpandedChange={setExpanded} />
      <main
        className={styles.ContentCol}
        style={{ marginLeft: expanded ? 248 : 56 }}
      >
        {children}
      </main>
    </div>
  );
}
