import { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import { PartnerAuthContext } from "./PartnerAuthContext";
import {
  getAllProperties,
  getPartnerProfile,
  getManagerProfile,
  getReceptionistProfile,
} from "../../../api/authService";

const VALID_USER_TYPES = ["partner", "manager", "receptionist"];

// Token and userType live in sessionStorage so each browser tab has its own
// session. That means a partner can be signed in in one tab while a manager
// or end-user is signed in in another tab without either tab forcing the
// other to log out. Sessions still survive a same-tab page refresh, and they
// expire when the tab is closed.
//
// Earlier versions of the app persisted profile/property/address info to
// localStorage; on startup we strip those keys from any browser that still
// has them, plus the legacy "token"/"userType" keys.
const LEGACY_LOCAL_STORAGE_KEYS = [
  "userProfile",
  "currentPropertyId",
  "userAddress",
  "adminInfo",
  "supportAgent",
  "authToken",
  "token",
  "userType",
];
try {
  LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
} catch {
  /* ignore storage errors */
}

export const PartnerAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem("token");
    } catch {
      return null;
    }
  });
  // Profile is held in React state only and refetched from the server on
  // bootstrap. userType is persisted (per-tab) so a page refresh restores
  // the correct profile-fetch path: /manager/profile for managers vs.
  // /partnerUser/getPartnerProfile for partners.
  const [userProfile, setUserProfile] = useState(null);
  const [userType, setUserType] = useState(() => {
    try {
      const stored = sessionStorage.getItem("userType");
      return VALID_USER_TYPES.includes(stored) ? stored : "partner";
    } catch {
      return "partner";
    }
  });
  const [properties, setProperties] = useState([]);

  // Ref to prevent duplicate API calls
  const fetchPropertiesInProgress = useRef(false);

  // ✅ Logout function — clears the per-tab token + userType. Does NOT touch
  // localStorage (which is no longer used for these) so other tabs are not
  // disturbed.
  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userType");
    } catch {
      /* ignore */
    }
    setToken(null);
    setUserProfile(null);
    setUserType("partner");
    setProperties([]);
  }, []);

  // ✅ Fetch properties from server.
  // For managers and receptionists we don't call the partner-only
  // /getAllProperties endpoint — their single assigned property already
  // comes back in their profile response, so we derive the properties array
  // from it. This keeps ManagerDashboard/receptionist pages' `properties`
  // consumption unchanged.
  const fetchProperties = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchPropertiesInProgress.current) {
      return;
    }

    if (userType === "manager" || userType === "receptionist") {
      const assignedProperty = userProfile?.property;
      const arr = assignedProperty ? [assignedProperty] : [];
      setProperties(arr);
      return arr;
    }

    try {
      fetchPropertiesInProgress.current = true;
      const response = await getAllProperties();
      // Parse the response structure: response.data.data.partnerAllProperties
      const propertyData =
        response.data?.data?.partnerAllProperties ||
        response.data?.partnerAllProperties ||
        response.data ||
        [];
      const propertiesArray = Array.isArray(propertyData) ? propertyData : [];
      setProperties(propertiesArray);
      return propertiesArray;
    } catch {
      setProperties([]);
      return [];
    } finally {
      fetchPropertiesInProgress.current = false;
    }
  }, [userType, userProfile?.property]);

  // ✅ Fetch profile after login (when we have token but need profile)
  // Branches by userType so managers/receptionists don't hit the
  // partner-only endpoint (which would return 4xx and blank out the profile
  // we just received from /manager/login or /receptionist/login).
  const fetchProfileAfterLogin = useCallback(
    async (token, type) => {
      if (!token) return null;

      try {
        if (type === "manager") {
          const response = await getManagerProfile();
          const profileData =
            response.data?.data?.managerProfile ||
            response.data?.managerProfile ||
            response.data?.data ||
            response.data;

          if (profileData) {
            setUserProfile(profileData);
            return profileData;
          }
          return null;
        }

        if (type === "receptionist") {
          const response = await getReceptionistProfile();
          const profileData =
            response.data?.data?.receptionistProfile ||
            response.data?.receptionistProfile ||
            response.data?.data ||
            response.data;

          if (profileData) {
            setUserProfile(profileData);
            return profileData;
          }
          return null;
        }

        const response = await getPartnerProfile();
        const profileData =
          response.data?.data?.partnerUserProfile ||
          response.data?.partnerUserProfile ||
          response.data;

        if (profileData) {
          setUserProfile(profileData);
          return profileData;
        }
      } catch {
        return null;
      }
    },
    [],
  );

  // ✅ Login function — token + userType are persisted per-tab via
  // sessionStorage so other tabs are unaffected by this login.
  const login = useCallback(
    async (token, partnerUserProfile = null, type = "partner") => {
      try {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userType", type);
      } catch {
        /* ignore storage errors */
      }
      // Clean up the legacy localStorage token/userType from earlier versions
      // so cross-tab storage events can't accidentally re-trigger them.
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
      } catch {
        /* ignore */
      }
      setToken(token);
      setUserType(type);

      if (partnerUserProfile) {
        setUserProfile(partnerUserProfile);
      } else {
        // If no profile provided, fetch it after setting the token
        setUserProfile(null);
        // We'll fetch the profile in a separate call after the token is set
      }

      // Properties will be fetched automatically by the useEffect below
    },
    [],
  );

  // ✅ Update user profile locally (in-memory only)
  const updateProfile = useCallback(
    (newData) => {
      const updated = { ...userProfile, ...newData };
      setUserProfile(updated);
    },
    [userProfile],
  );

  // ✅ Refresh user profile from server (in-memory only)
  const refreshProfile = useCallback(async () => {
    if (!userProfile) {
      return null;
    }

    try {
      if (userType === "manager") {
        const response = await getManagerProfile();
        const profileData =
          response.data?.data?.managerProfile ||
          response.data?.managerProfile ||
          response.data?.data ||
          response.data;
        if (profileData) {
          setUserProfile(profileData);
          return profileData;
        }
        return null;
      }

      if (userType === "receptionist") {
        const response = await getReceptionistProfile();
        const profileData =
          response.data?.data?.receptionistProfile ||
          response.data?.receptionistProfile ||
          response.data?.data ||
          response.data;
        if (profileData) {
          setUserProfile(profileData);
          return profileData;
        }
        return null;
      }

      const response = await getPartnerProfile();
      const profileData =
        response.data?.data?.partnerUserProfile ||
        response.data?.partnerUserProfile ||
        response.data;

      if (profileData) {
        setUserProfile(profileData);
        return profileData;
      }
    } catch {
      return null;
    }
  }, [userProfile, userType]);

  // ✅ Refresh properties from server (call this after property changes)
  const refreshProperties = useCallback(async () => {
    return await fetchProperties();
  }, [fetchProperties]);

  // NOTE: We deliberately do NOT listen for "storage" events here.
  // Tokens live in sessionStorage (per-tab), so cross-tab logins must not
  // affect this tab. A previous version of this provider force-logged-out
  // the active tab whenever any other tab logged in — that broke the
  // multi-account-in-multiple-tabs workflow.

  // On mount: if there's no token in this tab's sessionStorage, normalize
  // state via logout(). Other tabs are left alone.
  useEffect(() => {
    try {
      const tokenInStorage = sessionStorage.getItem("token");
      if (!tokenInStorage) {
        logout();
      }
    } catch {
      // ignore storage access errors
    }
  }, [logout]);

  // Refresh profile from server when we have a token (on mount/refresh or login)
  useEffect(() => {
    if (token) {
      // Always fetch fresh profile from server when we have a token.
      // Pass userType so the fetch hits /manager/profile for managers and
      // /partnerUser/getPartnerProfile for partners.
      // This handles both: 1) fresh login, 2) page refresh with existing token
      fetchProfileAfterLogin(token, userType);
    }
  }, [token, userType, fetchProfileAfterLogin]);

  // Fetch properties when user has a valid token
  useEffect(() => {
    if (token && userProfile) {
      fetchProperties();
    }
  }, [token, userProfile, fetchProperties]);

  return (
    <PartnerAuthContext.Provider
      value={{
        token,
        userProfile,
        userType,
        properties,
        // legacy aliases kept for components that expect partnerProfile
        partnerProfile: userProfile,
        setUserProfile,
        setPartnerProfile: setUserProfile,
        login,
        logout,
        updateProfile,
        refreshProfile,
        fetchProperties,
        refreshProperties,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};
