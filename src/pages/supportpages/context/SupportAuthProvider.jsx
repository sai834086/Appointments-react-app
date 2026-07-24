import { useState, useCallback } from "react";
import { SupportAuthContext } from "./SupportAuthContext";

// Token + agent profile are stored in sessionStorage so each browser tab has
// its own support-portal session. Logging in as a different account (support,
// partner, manager, user, admin) in another tab does NOT terminate this tab.
// Sessions still survive a same-tab refresh and end when the tab closes.
function readSessionAgent() {
  try {
    const raw = sessionStorage.getItem("supportAgent");
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
    const fromSession = sessionStorage.getItem("supportToken");
    if (fromSession) return fromSession;
    const legacy = localStorage.getItem("supportToken");
    if (legacy) {
      try {
        sessionStorage.setItem("supportToken", legacy);
        localStorage.removeItem("supportToken");
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

export const SupportAuthProvider = ({ children }) => {
  const [token, setToken] = useState(readSessionToken);

  const [agent, setAgent] = useState(readSessionAgent);

  const login = useCallback((token, agentData) => {
    try {
      sessionStorage.setItem("supportToken", token);
      sessionStorage.setItem("supportAgent", JSON.stringify(agentData));
    } catch {
      /* ignore storage errors */
    }
    // Drop any leftover legacy localStorage copy.
    try {
      localStorage.removeItem("supportToken");
    } catch {
      /* ignore */
    }
    setToken(token);
    setAgent(agentData);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem("supportToken");
      sessionStorage.removeItem("supportAgent");
    } catch {
      /* ignore storage errors */
    }
    setToken(null);
    setAgent(null);
  }, []);

  return (
    <SupportAuthContext.Provider value={{ token, agent, login, logout }}>
      {children}
    </SupportAuthContext.Provider>
  );
};
