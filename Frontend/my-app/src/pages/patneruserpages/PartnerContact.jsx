import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerInfoPage.module.css";
import { Mail, Phone, MessageSquare, Clock } from "lucide-react";

/**
 * PartnerContact
 * --------------
 * Contact directory page for partners and managers. Static content for now —
 * a future iteration can replace the placeholder form with a real ticket
 * submission endpoint.
 */
export default function PartnerContact() {
  const channels = [
    {
      icon: Mail,
      label: "Email",
      value: "support@propertyhub.app",
      href: "mailto:support@propertyhub.app",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+1 (800) 555-0102",
      href: "tel:+18005550102",
    },
    {
      icon: MessageSquare,
      label: "Live chat",
      value: "Mon–Fri · 9am–6pm CT",
    },
    {
      icon: Clock,
      label: "Response time",
      value: "Within 1 business day",
    },
  ];

  return (
    <div className={styles.Container}>
      <Header />
      <div className={styles.Body}>
        <div className={styles.Hero}>
          <div className={styles.HeroIcon} aria-hidden="true">
            <Mail size={28} />
          </div>
          <div>
            <h1 className={styles.HeroTitle}>Contact us</h1>
            <p className={styles.HeroSubtitle}>
              Our team is here to help with anything from onboarding to
              billing. Pick the channel that fits.
            </p>
          </div>
        </div>

        <section className={styles.CardGrid} aria-label="Contact options">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <article key={label} className={styles.Card}>
              <div className={styles.CardIcon} aria-hidden="true">
                <Icon size={20} />
              </div>
              <h2 className={styles.CardTitle}>{label}</h2>
              {href ? (
                <a className={styles.CardLink} href={href}>
                  {value}
                </a>
              ) : (
                <p className={styles.CardBody}>{value}</p>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
