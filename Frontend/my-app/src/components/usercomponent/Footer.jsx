import styles from "./Footer.module.css";
import {
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3 className={styles.sectionTitle}>About Appointys</h3>
          <p className={styles.description}>
            Your trusted platform for booking professional services and
            appointments with ease.
          </p>
        </div>

        <div className={styles.footerSection}>
          <h3 className={styles.sectionTitle}>Quick Links</h3>
          <ul className={styles.linkList}>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#services">Services</a>
            </li>
            <li>
              <a href="#bookings">My Bookings</a>
            </li>
            <li>
              <a href="#account">Account</a>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h3 className={styles.sectionTitle}>Contact</h3>
          <div className={styles.contactItem}>
            <FontAwesomeIcon icon={faPhone} className={styles.contactIcon} />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className={styles.contactItem}>
            <FontAwesomeIcon icon={faEnvelope} className={styles.contactIcon} />
            <span>support@appointys.com</span>
          </div>
          <div className={styles.contactItem}>
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              className={styles.contactIcon}
            />
            <span>123 Business Ave, City, State</span>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          &copy; {currentYear} Appointys. All rights reserved.
        </p>
        <div className={styles.socialLinks}>
          <a href="#facebook" className={styles.socialLink}>
            Facebook
          </a>
          <a href="#twitter" className={styles.socialLink}>
            Twitter
          </a>
          <a href="#instagram" className={styles.socialLink}>
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
