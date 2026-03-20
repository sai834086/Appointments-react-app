import React, { useRef, useEffect } from "react";
import styles from "./AccountDropdown.module.css";
import { LogOut, Settings, HelpCircle, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccountDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

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
      onClick: () => {
        navigate("/profile");
        onClose();
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: () => {
        navigate("/settings");
        onClose();
      },
    },
    {
      id: "help",
      label: "Help",
      icon: HelpCircle,
      onClick: () => {
        navigate("/help");
        onClose();
      },
    },
    {
      id: "contact",
      label: "Contact Us",
      icon: Mail,
      onClick: () => {
        navigate("/contact");
        onClose();
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div ref={dropdownRef} className={styles.dropdown}>
        <div className={styles.dropdownContent}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={styles.dropdownItem}
                onClick={item.onClick}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className={styles.divider}></div>

          <button className={styles.logoutItem} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
