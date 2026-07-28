import { useCallback, useContext, useEffect, useState } from "react";
import { NotificationContext } from "./NotificationContext";
import { PartnerAuthContext } from "./PartnerAuthContext";
import { getPartnerUnreadCount } from "../../../api/authService";

/** How often the badge re-checks the server, in ms. */
const POLL_INTERVAL = 60_000;

/**
 * Keeps the unread notification count in one place so the sidebar badge and
 * the notifications page never disagree. Polls once a minute while a partner
 * is signed in, and pauses while the tab is hidden.
 */
export default function NotificationProvider({ children }) {
  const { partnerProfile } = useContext(PartnerAuthContext) || {};
  const [unreadCount, setUnreadCount] = useState(0);

  const isAuthenticated = Boolean(partnerProfile);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getPartnerUnreadCount();
      const count = res?.data?.data?.unreadCount;
      if (typeof count === "number") setUnreadCount(count);
    } catch {
      // A failed poll shouldn't surface anywhere — keep the last known count.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return undefined;
    }

    refresh();

    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const id = setInterval(tick, POLL_INTERVAL);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [isAuthenticated, refresh]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refresh, setUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
