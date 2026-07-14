import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerInfoPage.module.css";
import { HelpCircle, BookOpen, MessageCircle, LifeBuoy } from "lucide-react";

/**
 * PartnerHelp
 * -----------
 * Lightweight Help & Support landing page that lives alongside the rest of
 * the partner sub-app. Linked from the sidebar.
 */
export default function PartnerHelp() {
  const topics = [
    {
      icon: BookOpen,
      title: "Getting started guide",
      body: "Walk through registering your first property, adding employees, and going live with bookings.",
    },
    {
      icon: MessageCircle,
      title: "FAQs",
      body: "Answers to common questions about availability, appointments, managers, and account settings.",
    },
    {
      icon: LifeBuoy,
      title: "Troubleshooting",
      body: "Resolve sign-in, sync, and payment issues with our step-by-step diagnostics.",
    },
  ];

  return (
    <div className={styles.Container}>
      <Header />
      <div className={styles.Body}>
        <div className={styles.Hero}>
          <div className={styles.HeroIcon} aria-hidden="true">
            <HelpCircle size={28} />
          </div>
          <div>
            <h1 className={styles.HeroTitle}>How can we help?</h1>
            <p className={styles.HeroSubtitle}>
              Browse common topics below, or reach out to our support team
              from the Contact Us page.
            </p>
          </div>
        </div>

        <section className={styles.CardGrid} aria-label="Help topics">
          {topics.map(({ icon: Icon, title, body }) => (
            <article key={title} className={styles.Card}>
              <div className={styles.CardIcon} aria-hidden="true">
                <Icon size={20} />
              </div>
              <h2 className={styles.CardTitle}>{title}</h2>
              <p className={styles.CardBody}>{body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
