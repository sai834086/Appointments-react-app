import { useState } from "react";
import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerInfoPage.module.css";
import notifStyles from "./PartnerNotifications.module.css";
import { Bell, Calendar, Users, Building2, CheckCheck } from "lucide-react";

/**
 * PartnerNotifications
 * --------------------
 * Lists recent activity that affects this partner — new appointments,
 * employee changes, property status updates, etc. The first cut shows a
 * curated demo feed; once the backend exposes a notifications endpoint
 * we'll swap the static array for a fetched list.
 */
const DEMO_FEED = [
  {
    id: "n-1",
    icon: Calendar,
    tone: "blue",
    title: "New appointment booked",
    body: "Aarav booked a Cleaning service at Diagnostics for tomorrow, 10:30 AM.",
    timestamp: "2 hours ago",
    unread: true,
  },
  {
    id: "n-2",
    icon: Users,
    tone: "violet",
    title: "Employee availability updated",
    body: "Priya updated her weekly hours at Gastro property.",
    timestamp: "Yesterday",
    unread: true,
  },
  {
    id: "n-3",
    icon: Building2,
    tone: "emerald",
    title: "Property went live",
    body: "Diagnostics property is now ACTIVE and accepting bookings.",
    timestamp: "2 days ago",
    unread: false,
  },
];

const TONE_STYLES = {
  blue: notifStyles.IconBlue,
  violet: notifStyles.IconViolet,
  emerald: notifStyles.IconEmerald,
};

export default function PartnerNotifications() {
  const [feed, setFeed] = useState(DEMO_FEED);
  const unreadCount = feed.filter((n) => n.unread).length;

  const markAllRead = () =>
    setFeed((list) => list.map((n) => ({ ...n, unread: false })));

  return (
    <div className={styles.Container}>
      <Header />
      <div className={styles.Body}>
        <div className={styles.Hero}>
          <div className={styles.HeroIcon} aria-hidden="true">
            <Bell size={28} />
          </div>
          <div className={notifStyles.HeroBody}>
            <div>
              <h1 className={styles.HeroTitle}>Notifications</h1>
              <p className={styles.HeroSubtitle}>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread update${unreadCount === 1 ? "" : "s"}.`
                  : "You're all caught up."}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={notifStyles.MarkAllBtn}
                onClick={markAllRead}
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        <section
          className={notifStyles.FeedSection}
          aria-label="Recent notifications"
        >
          {feed.length === 0 ? (
            <div className={notifStyles.EmptyState}>
              <Bell size={32} aria-hidden="true" />
              <h2>No notifications yet</h2>
              <p>
                Bookings, employee changes, and property updates will show up
                here.
              </p>
            </div>
          ) : (
            <ul className={notifStyles.FeedList}>
              {feed.map(({ id, icon: Icon, tone, title, body, timestamp, unread }) => (
                <li
                  key={id}
                  className={`${notifStyles.FeedItem} ${unread ? notifStyles.FeedItemUnread : ""}`}
                >
                  <div
                    className={`${notifStyles.FeedIcon} ${TONE_STYLES[tone] || ""}`}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </div>
                  <div className={notifStyles.FeedBody}>
                    <div className={notifStyles.FeedHead}>
                      <h3 className={notifStyles.FeedTitle}>{title}</h3>
                      <span className={notifStyles.FeedTime}>{timestamp}</span>
                    </div>
                    <p className={notifStyles.FeedText}>{body}</p>
                  </div>
                  {unread && (
                    <span
                      className={notifStyles.UnreadDot}
                      aria-label="Unread"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
