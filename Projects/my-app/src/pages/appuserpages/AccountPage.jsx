import React from "react";
import { useNavigate } from "react-router-dom";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./AccountPage.module.css";
import { LogOut, Settings, HelpCircle, Mail, User } from "lucide-react";

export default function AccountPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.clear();
    // Redirect to login with hard page refresh to prevent going back
    window.location.href = "/login";
  };

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      onClick: () => navigate("/profile"),
      color: "#0052a3",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: () => navigate("/settings"),
      color: "#0066cc",
    },
    {
      id: "help",
      label: "Help",
      icon: HelpCircle,
      onClick: () => navigate("/help"),
      color: "#0052a3",
    },
    {
      id: "contact",
      label: "Contact Us",
      icon: Mail,
      onClick: () => navigate("/contact"),
      color: "#0066cc",
    },
  ];

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.headerSection}>
        <h1 className={styles.headerTitle}>Account</h1>
      </div>
      <div className={styles.pageWrapper}>
        <div className={styles.content}>
          {/* Menu Items */}
          <div className={styles.menuList}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={styles.menuItem}
                  onClick={item.onClick}
                >
                  <div
                    className={styles.menuIcon}
                    style={{ color: item.color }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <div className={styles.chevron}>›</div>
                </button>
              );
            })}
          </div>

          {/* Logout Section */}
          <div className={styles.logoutSection}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
