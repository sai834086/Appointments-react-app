import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerInfoPage.module.css";
import settingsStyles from "./PartnerSettings.module.css";
import { Settings, Bell, Lock, UserCog, LogOut } from "lucide-react";
import { PartnerAuthContext } from "./context/PartnerAuthContext";

/**
 * PartnerSettings
 * ---------------
 * Hub for partner-level configuration. Cards link out to per-area screens
 * (account, notifications, security). The sign-out control lives here at
 * the bottom in a clearly-marked danger zone so users have one canonical
 * place to end their session.
 */
export default function PartnerSettings() {
  const { logout, userType } = useContext(PartnerAuthContext) || {};
  const navigate = useNavigate();

  const groups = [
    {
      icon: UserCog,
      title: "Account",
      body: "Update your business name, contact info, and password.",
      ctaLabel: "Open profile",
      ctaTo: "/partner/account",
    },
    {
      icon: Bell,
      title: "Notifications",
      body: "Review activity, mark items read, and tune which alerts arrive.",
      ctaLabel: "Open notifications",
      ctaTo: "/partner/notifications",
    },
    {
      icon: Lock,
      title: "Security",
      body: "Manage two-factor authentication and active sessions across devices.",
      ctaLabel: "Coming soon",
    },
  ];

  const handleSignOut = () => {
    try {
      if (typeof logout === "function") logout();
    } catch {
      /* silent */
    }
    navigate(
      userType === "manager" ? "/partner/manager/login" : "/partner/login",
    );
  };

  return (
    <div className={styles.Container}>
      <Header />
      <div className={styles.Body}>
        <div className={styles.Hero}>
          <div className={styles.HeroIcon} aria-hidden="true">
            <Settings size={28} />
          </div>
          <div>
            <h1 className={styles.HeroTitle}>Settings</h1>
            <p className={styles.HeroSubtitle}>
              Fine-tune your account, notifications, and security
              preferences.
            </p>
          </div>
        </div>

        <section className={styles.CardGrid} aria-label="Settings groups">
          {groups.map(({ icon: Icon, title, body, ctaLabel, ctaTo }) => (
            <article key={title} className={styles.Card}>
              <div className={styles.CardIcon} aria-hidden="true">
                <Icon size={20} />
              </div>
              <h2 className={styles.CardTitle}>{title}</h2>
              <p className={styles.CardBody}>{body}</p>
              {ctaTo ? (
                <Link className={styles.CardCta} to={ctaTo}>
                  {ctaLabel}
                </Link>
              ) : (
                <span className={styles.CardCtaDisabled}>{ctaLabel}</span>
              )}
            </article>
          ))}
        </section>

        {/* Sign out lives here so there's one canonical place to end a session.
            Styled as a clearly-marked danger card so it can't be triggered
            accidentally. */}
        <section
          className={settingsStyles.DangerCard}
          aria-labelledby="signout-heading"
        >
          <div className={settingsStyles.DangerHeader}>
            <div
              className={settingsStyles.DangerIcon}
              aria-hidden="true"
            >
              <LogOut size={20} />
            </div>
            <div>
              <h2
                id="signout-heading"
                className={settingsStyles.DangerTitle}
              >
                Sign out
              </h2>
              <p className={settingsStyles.DangerBody}>
                End your session on this device. You can sign back in any
                time using your usual credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={settingsStyles.DangerBtn}
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </section>
      </div>
    </div>
  );
}
