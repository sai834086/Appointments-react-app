import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardStats } from "../../../api/authService";

/**
 * useDashboardStats
 * -----------------
 * Loads the partner dashboard numbers for all three periods (TODAY / MONTH /
 * YEAR) in parallel, so the UI can show every appointment count at once —
 * matching the "three circles" layout — instead of making the user toggle
 * a period dropdown.
 *
 * The backend endpoint returns the SAME portfolio totals (properties,
 * employees, services) regardless of period, so those are lifted from any
 * successful response.
 *
 * Returns:
 *   appointments  { TODAY, MONTH, YEAR }  numbers, or null per-period on failure
 *   totals        { properties, employees, services } | null
 *   profile       { firstName, businessName } | null
 *   loading       true during the initial load AND during refetches
 *   error         string | null — set only when EVERY period failed
 *   refetch()     manual retry, also used by the focus/visibility listeners
 */

export const STAT_PERIODS = ["TODAY", "MONTH", "YEAR"];

export default function useDashboardStats() {
  const [appointments, setAppointments] = useState({
    TODAY: null,
    MONTH: null,
    YEAR: null,
  });
  const [totals, setTotals] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // De-duplicates overlapping loads (mount + focus + visibility can fire
  // together when the user returns to the tab).
  const busyRef = useRef(false);

  const refetch = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        STAT_PERIODS.map((period) => getDashboardStats(period)),
      );

      const nextAppointments = {};
      let nextTotals = null;
      let nextProfile = null;
      let anySuccess = false;
      let firstMessage = null;

      results.forEach((result, index) => {
        const period = STAT_PERIODS[index];
        if (result.status === "fulfilled") {
          const stats = result.value?.data?.data?.stats;
          if (stats) {
            anySuccess = true;
            nextAppointments[period] = {
              total: stats.totalAppointments ?? 0,
              // Status breakdown — null on older backend builds.
              booked: stats.bookedAppointments ?? null,
              completed: stats.completedAppointments ?? null,
              cancelled: stats.cancelledAppointments ?? null,
            };
            nextTotals = {
              properties: {
                total: stats.totalProperties ?? 0,
                // Breakdown fields are absent on older backend builds —
                // null tells the UI to hide the Active/Inactive circles.
                active: stats.activeProperties ?? null,
                inactive: stats.inactiveProperties ?? null,
              },
              employees: {
                total: stats.totalEmployees ?? 0,
                active: stats.activeEmployees ?? null,
                inactive: stats.inactiveEmployees ?? null,
              },
              // A service is ACTIVE when at least one employee offers it.
              services: {
                total: stats.totalServices ?? 0,
                active: stats.activeServices ?? null,
                inactive: stats.inactiveServices ?? null,
              },
            };
            nextProfile = {
              firstName: stats.firstName || null,
              businessName: stats.businessName || null,
            };
            return;
          }
        }
        nextAppointments[period] = null;
        if (!firstMessage) {
          firstMessage =
            result.reason?.response?.data?.message ||
            "Could not load dashboard stats right now.";
        }
      });

      setAppointments(nextAppointments);
      if (nextTotals) setTotals(nextTotals);
      if (nextProfile) setProfile(nextProfile);
      if (!anySuccess) setError(firstMessage);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    // Keep numbers fresh when the user comes back to the tab.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refetch);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refetch);
    };
  }, [refetch]);

  return { appointments, totals, profile, loading, error, refetch };
}
