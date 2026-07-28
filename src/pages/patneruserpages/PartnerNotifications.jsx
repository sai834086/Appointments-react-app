import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerInfoPage.module.css";
import notifStyles from "./PartnerNotifications.module.css";
import {
  Bell,
  Calendar,
  CalendarX,
  Users,
  UserCog,
  Building2,
  Pencil,
  Clock,
  CheckCheck,
  Loader2,
} from "lucide-react";
import {
  getPartnerNotifications,
  markAllPartnerNotificationsRead,
  markPartnerNotificationRead,
} from "../../api/authService";
import { NotificationContext } from "./context/NotificationContext";

/**
 * PartnerNotifications
 * --------------------
 * The partner's activity feed — appointments, property status changes,
 * manager and employee updates. Data comes from
 * GET /appointments/partnerUser/notifications; the unread count is shared with
 * the sidebar badge through NotificationContext.
 */

/** Icon + colour tone per notification type sent by the backend. */
const TYPE_META = {
  APPOINTMENT_BOOKED: { icon: Calendar, tone: notifStyles.IconBlue },
  APPOINTMENT_CANCELLED: { icon: CalendarX, tone: notifStyles.IconRose },
  PROPERTY_STATUS_CHANGED: { icon: Building2, tone: notifStyles.IconEmerald },
  PROPERTY_UPDATED: { icon: Pencil, tone: notifStyles.IconBlue },
  MANAGER_CHANGED: { icon: UserCog, tone: notifStyles.IconViolet },
  EMPLOYEE_ADDED: { icon: Users, tone: notifStyles.IconViolet },
  EMPLOYEE_AVAILABILITY_UPDATED: { icon: Clock, tone: notifStyles.IconAmber },
};

const DEFAULT_META = { icon: Bell, tone: "" };

/** Relative time, computed client-side so it never goes stale. */
function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Which heading a notification sits under. */
function groupOf(value) {
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "Earlier";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (then >= startOfToday) return "Today";

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  return then >= startOfYesterday ? "Yesterday" : "Earlier";
}

const GROUP_ORDER = ["Today", "Yesterday", "Earlier"];

export default function PartnerNotifications() {
  const { setUnreadCount, refresh } = useContext(NotificationContext) || {};

  const [feed, setFeed] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unreadCount = feed.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPartnerNotifications({ size: 50 });
      const data = res?.data?.data || {};
      setFeed(Array.isArray(data.notifications) ? data.notifications : []);
      if (typeof data.unreadCount === "number" && setUnreadCount) {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      setError("Couldn't load your notifications. Try again.");
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic — revert by refetching if the request fails.
    const previous = feed;
    setFeed((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount?.(0);

    try {
      await markAllPartnerNotificationsRead();
    } catch {
      setFeed(previous);
      refresh?.();
    }
  };

  const handleOpen = async (item) => {
    if (!item.isRead) {
      const previous = feed;
      setFeed((list) =>
        list.map((n) =>
          n.notificationId === item.notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount?.(Math.max(0, unreadCount - 1));

      try {
        await markPartnerNotificationRead(item.notificationId);
      } catch {
        setFeed(previous);
        refresh?.();
      }
    }

    // The feed is read-only: clicking marks the row read but deliberately
    // doesn't navigate. The `link` field on the response is left unused.
  };

  const groups = useMemo(() => {
    const visible = filter === "unread" ? feed.filter((n) => !n.isRead) : feed;
    return GROUP_ORDER.map((label) => ({
      label,
      items: visible.filter((n) => groupOf(n.createdAt) === label),
    })).filter((g) => g.items.length > 0);
  }, [feed, filter]);

  const isEmpty = !loading && groups.length === 0;

  return (
    <div className={styles.Container}>
      <Header />
      <div className={styles.Body}>
        <section className={notifStyles.Panel} aria-label="Notifications">
          {/* ---------- Header ---------- */}
          <header className={notifStyles.PanelHead}>
            <div className={notifStyles.HeadText}>
              <h1 className={notifStyles.HeadTitle}>Notifications</h1>
              <p className={notifStyles.HeadSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>

            <div
              className={notifStyles.Tabs}
              role="tablist"
              aria-label="Filter notifications"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === "all"}
                className={`${notifStyles.Tab} ${
                  filter === "all" ? notifStyles.TabActive : ""
                }`}
                onClick={() => setFilter("all")}
              >
                All <span className={notifStyles.TabCount}>{feed.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === "unread"}
                className={`${notifStyles.Tab} ${
                  filter === "unread" ? notifStyles.TabActive : ""
                }`}
                onClick={() => setFilter("unread")}
              >
                Unread{" "}
                <span className={notifStyles.TabCount}>{unreadCount}</span>
              </button>
            </div>

            <button
              type="button"
              className={notifStyles.MarkAllBtn}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={15} strokeWidth={2.25} aria-hidden="true" />
              Mark all read
            </button>
          </header>

          {/* ---------- Body ---------- */}
          {loading ? (
            <div className={notifStyles.EmptyState}>
              <Loader2
                size={26}
                strokeWidth={2}
                className={notifStyles.Spinner}
                aria-hidden="true"
              />
              <p>Loading your notifications…</p>
            </div>
          ) : error ? (
            <div className={notifStyles.EmptyState}>
              <Bell size={28} strokeWidth={1.75} aria-hidden="true" />
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button
                type="button"
                className={notifStyles.MarkAllBtn}
                onClick={load}
              >
                Try again
              </button>
            </div>
          ) : isEmpty ? (
            <div className={notifStyles.EmptyState}>
              <Bell size={28} strokeWidth={1.75} aria-hidden="true" />
              <h2>
                {filter === "unread" ? "Nothing unread" : "No notifications yet"}
              </h2>
              <p>
                {filter === "unread"
                  ? "You've read everything in your feed."
                  : "Bookings, employee changes, and property updates will show up here."}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <p className={notifStyles.GroupLabel}>{group.label}</p>
                <ul className={notifStyles.FeedList}>
                  {group.items.map((item) => {
                    const meta = TYPE_META[item.type] || DEFAULT_META;
                    const ItemIcon = meta.icon;
                    const unread = !item.isRead;

                    return (
                      <li
                        key={item.notificationId}
                        className={`${notifStyles.FeedItem} ${
                          unread ? notifStyles.FeedItemUnread : ""
                        }`}
                        onClick={() => handleOpen(item)}
                      >
                        {unread && (
                          <span
                            className={notifStyles.UnreadDot}
                            aria-label="Unread"
                          />
                        )}

                        <span
                          className={`${notifStyles.FeedIcon} ${meta.tone}`}
                          aria-hidden="true"
                        >
                          <ItemIcon size={17} strokeWidth={2} />
                        </span>

                        <div className={notifStyles.FeedBody}>
                          <h3 className={notifStyles.FeedTitle}>
                            {item.title}
                          </h3>
                          <p className={notifStyles.FeedText}>{item.message}</p>
                        </div>

                        <span className={notifStyles.FeedTime}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
