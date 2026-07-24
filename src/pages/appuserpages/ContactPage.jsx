import React from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "./UserLayout";
import styles from "./ContactPage.module.css";
import { ChevronLeft } from "lucide-react";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <UserLayout>
      <section className={styles.wrapper}>
        <div className={styles.headerSection}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/account")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Contact Us</h1>
        </div>
        <div className={styles.card}>
          <p className={styles.label}>Email</p>
          <p className={styles.value}>support@appointys.com</p>
          <p className={styles.label}>Phone</p>
          <p className={styles.value}>+1 (800) 555-0100</p>
          <p className={styles.label}>Support Hours</p>
          <p className={styles.value}>Monday to Saturday, 9:00 AM - 6:00 PM</p>
        </div>
      </section>
    </UserLayout>
  );
}
