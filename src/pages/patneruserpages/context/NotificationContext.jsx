import { createContext } from "react";

/**
 * Shared unread-notification count.
 *
 * Lives in its own module so the context object has a stable identity across
 * fast-refresh reloads (a file may only export components for HMR to work).
 *
 * Shape: { unreadCount: number, refresh: () => Promise<void>, setUnreadCount }
 */
export const NotificationContext = createContext({
  unreadCount: 0,
  refresh: async () => {},
  setUnreadCount: () => {},
});
