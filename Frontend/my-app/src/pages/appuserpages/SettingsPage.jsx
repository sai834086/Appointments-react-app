import React from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "./UserLayout";
import styles from "./SettingsPage.module.css";
import { ChevronLeft } from "lucide-react";
import { Bell, MapPin, Shield, Globe, LogOut } from "lucide-react";

const settingItems = [
  {
    id: "notifications",
    label: "Notification Preferences",
    description: "Manage reminders and booking alerts",
    icon: Bell,
  },
  {
    id: "location",
    label: "Location Access",
    description: "Control location-based recommendations",
    icon: MapPin,
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    description: "Review account privacy and sign-in protection",
    icon: Shield,
  },
  {
    id: "language",
    label: "Language & Region",
    description: "Choose your preferred app language and region",
    icon: Globe,
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // localStorage only holds the JWT token, but we clear both stores to drop
    // any session-scoped profile/address data too.
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore storage errors */
    }
    window.location.href = "/login";
  };

  return (
    <UserLayout>
      <div className={styles.headerSection}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/account")}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.headerTitle}>Settings</h1>
      </div>

      <div className={styles.pageWrapper}>
        <div className={styles.content}>
          <div className={styles.settingsList}>
            {settingItems.map((item) => {
              const IconComponent = item.icon;

              return (
                <div key={item.id} className={styles.settingItem}>
                  <div className={styles.settingIcon}>
                    <IconComponent size={22} />
                  </div>
                  <div className={styles.settingContent}>
                    <h2 className={styles.settingLabel}>{item.label}</h2>
                    <p className={styles.settingDescription}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.logoutSection}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
