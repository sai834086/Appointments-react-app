import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "./UserLayout";
import styles from "./NotificationsPage.module.css";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/userService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarCheck,
  faCalendarXmark,
  faCalendarDay,
  faCheckDouble,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const TYPE_META = {
  BOOKING_CONFIRMED:   { icon: faCalendarCheck, color: "#16a34a", bg: "#f0fdf4" },
  BOOKING_CANCELLED:   { icon: faCalendarXmark,  color: "#dc2626", bg: "#fef2f2" },
  BOOKING_RESCHEDULED: { icon: faCalendarDay,    color: "#d97706", bg: "#fffbeb" },
};

// Which tab to land on for each notification type
const TYPE_TAB = {
  BOOKING_CONFIRMED:   "upcoming",
  BOOKING_RESCHEDULED: "upcoming",
  BOOKING_CANCELLED:   "cancelled",
};

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getNotifications();
        setNotifications(res.data?.data?.notifications || []);
      } catch { setError("Failed to load notifications."); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleClick = async (n) => {
    // Mark as read (optimistic)
    if (!n.isRead) {
      try {
        await markNotificationRead(n.notificationId);
        setNotifications(prev =>
          prev.map(item => item.notificationId === n.notificationId ? { ...item, isRead: true } : item)
        );
      } catch { /* silent */ }
    }

    // Navigate to bookings, targeting the right tab and highlighting the booking
    navigate("/bookings", {
      state: {
        notificationRef:  n.referenceId,
        notificationType: n.type,
      },
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  return (
    <UserLayout>
      <div className={styles.pageWrapper}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && (
              <p className={styles.subtitle}>{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
              <FontAwesomeIcon icon={faCheckDouble} />
              Mark all as read
            </button>
          )}
        </div>

        {/* States */}
        {loading && <div className={styles.stateBox}>Loading notifications…</div>}
        {error   && <div className={`${styles.stateBox} ${styles.stateError}`}>{error}</div>}

        {!loading && !error && notifications.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <FontAwesomeIcon icon={faBell} className={styles.emptyIcon} />
            </div>
            <p className={styles.emptyTitle}>All caught up!</p>
            <p className={styles.emptySubtitle}>No notifications yet.</p>
          </div>
        )}

        {/* List */}
        {!loading && notifications.length > 0 && (
          <div className={styles.list}>
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.BOOKING_CONFIRMED;
              return (
                <div
                  key={n.notificationId}
                  className={`${styles.item} ${!n.isRead ? styles.itemUnread : ""}`}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && handleClick(n)}
                  aria-label={n.title}
                >
                  {!n.isRead && <span className={styles.unreadDot} />}

                  <div
                    className={styles.iconWrap}
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <FontAwesomeIcon icon={meta.icon} />
                  </div>

                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <p className={styles.itemTitle}>{n.title}</p>
                      <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className={styles.itemMsg}>{n.message}</p>
                    {n.referenceId && (
                      <span className={styles.refBadge}>#{n.referenceId}</span>
                    )}
                  </div>

                  <FontAwesomeIcon icon={faChevronRight} className={styles.itemChevron} />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </UserLayout>
  );
}
