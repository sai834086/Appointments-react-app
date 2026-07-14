import { useState, useCallback } from "react";
import { AdminAuthContext } from "./AdminAuthContext";

// Token + admin profile are stored in sessionStorage so each browser tab has
// its own admin-portal session. Logging in as a different account (admin,
// support, partner, manager, user) in another tab does NOT terminate this
// tab. Sessions still survive a same-tab refresh and end when the tab closes.
function readSessionAdmin() {
  try {
    const raw = sessionStorage.getItem("adminInfo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readSessionToken() {
  try {
    // sessionStorage is the canonical source. Fall back to the legacy
    // localStorage key once so existing sessions don't get force-logged-out
    // by the migration; we promote the value into sessionStorage and clear
    // the legacy copy.
    const fromSession = sessionStorage.getItem("adminToken");
    if (fromSession) return fromSession;
    const legacy = localStorage.getItem("adminToken");
    if (legacy) {
      try {
        sessionStorage.setItem("adminToken", legacy);
        localStorage.removeItem("adminToken");
      } catch {
        /* ignore storage errors */
      }
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(readSessionToken);
  const [admin, setAdmin] = useState(readSessionAdmin);

  const login = useCallback((token, adminInfo) => {
    try {
      sessionStorage.setItem("adminToken", token);
      sessionStorage.setItem("adminInfo", JSON.stringify(adminInfo));
    } catch {
      /* ignore storage errors */
    }
    // Drop any leftover legacy localStorage copy.
    try {
      localStorage.removeItem("adminToken");
    } catch {
      /* ignore */
    }
    setToken(token);
    setAdmin(adminInfo);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminInfo");
    } catch {
      /* ignore storage errors */
    }
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
