import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AccountPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGear,
  faCircleQuestion,
  faEnvelope,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const MENU_ITEMS = [
  { label: "Profile",    icon: faUser,           path: "/profile" },
  { label: "Settings",   icon: faGear,           path: "/settings" },
  { label: "Help",       icon: faCircleQuestion, path: "/help" },
  { label: "Contact Us", icon: faEnvelope,       path: "/contact" },
];

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Account</h1>

      <div className={styles.menuList}>
         {MENU_ITEMS.map(({ label, icon, path }) => {
          const isActive = location.pathname === path;
          return (
           <button
             key={label}
             className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
             onClick={() => navigate(path)}
           >
             <span className={styles.menuIcon}>
               <FontAwesomeIcon icon={icon} />
             </span>
             <span className={styles.menuLabel}>{label}</span>
             <FontAwesomeIcon icon={faChevronRight} className={styles.menuChevron} />
           </button>
          );
        })}
      </div>
    </div>
  );
}

