import React from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "./UserLayout";
import styles from "./HelpPage.module.css";
import { ChevronLeft } from "lucide-react";

const helpItems = [
  {
    title: "Booking Support",
    description:
      "Get help with booking confirmation, rescheduling, and cancellations.",
  },
  {
    title: "Payments & Charges",
    description:
      "Find answers about fees, charges, and payment-related questions.",
  },
  {
    title: "Account Assistance",
    description: "Learn how to update your details and manage account access.",
  },
];

export default function HelpPage() {
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
          <h1 className={styles.title}>Help</h1>
        </div>
        <div className={styles.list}>
          {helpItems.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardText}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </UserLayout>
  );
}
