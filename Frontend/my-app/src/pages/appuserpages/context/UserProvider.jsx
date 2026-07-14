import { useState } from "react";
import { UserContext } from "./UserContext";

// Token is stored in sessionStorage (per-tab) so logging in as a different
// user/partner/manager in another tab does NOT terminate this tab's session.
// Each tab keeps its own JWT until the user explicitly logs out, the tab is
// closed, or the token expires.
export const UserProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem("token");
    } catch {
      return null;
    }
  });
  const login = (newToken) => {
    setToken(newToken);
    try {
      sessionStorage.setItem("token", newToken);
    } catch {
      /* ignore storage errors */
    }
    // Clear any legacy localStorage token from prior versions of the app.
    try {
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
  };
  return (
    <UserContext.Provider value={{ token, login }}>
      {children}
    </UserContext.Provider>
  );
};
