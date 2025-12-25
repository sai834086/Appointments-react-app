import React, { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import { PartnerAuthContext } from "./PartnerAuthContext";
import { getAllProperties, getPartnerProfile } from "../../../api/authService";

export const PartnerAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // If this tab was force-logged-out by another tab, ignore any stored token
    if (sessionStorage.getItem("loggedOutByOtherTab")) return null;
    return localStorage.getItem("token");
  });
  const [userProfile, setUserProfile] = useState(() => {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  });
  const [properties, setProperties] = useState([]);

  // Ref to prevent duplicate API calls
  const fetchPropertiesInProgress = useRef(false);

  // ✅ Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    setToken(null);
    setUserProfile(null);
    setProperties([]);
  }, []);

  // ✅ Fetch properties from server
  const fetchProperties = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchPropertiesInProgress.current) {
      return;
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
  }, []);

  // ✅ Extract partnerId from JWT token
  const extractPartnerIdFromToken = useCallback((token) => {
    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) return null;

      // Decode the payload (base64)
      const payload = JSON.parse(atob(tokenParts[1]));

      // The partnerId might be stored in different fields depending on how JWT is generated
      // Common fields: sub, userId, partnerId, id
      return payload.partnerId || payload.id || payload.sub || payload.userId;
    } catch {
      return null;
    }
  }, []);

  // ✅ Fetch profile after login (when we have token but need profile)
  const fetchProfileAfterLogin = useCallback(
    async (token) => {
      if (!token) return null;

      // Extract partnerId from JWT token
      const partnerId = extractPartnerIdFromToken(token);

      if (!partnerId) {
        return null;
      }

      try {
        const response = await getPartnerProfile(partnerId);
        const profileData =
          response.data?.data?.partnerUserProfile ||
          response.data?.partnerUserProfile ||
          response.data;

        if (profileData) {
          setUserProfile(profileData);
          localStorage.setItem("userProfile", JSON.stringify(profileData));
          return profileData;
        }
      } catch {
        return null;
      }
    },
    [extractPartnerIdFromToken]
  );

  // ✅ Login function
  const login = useCallback(async (token, partnerUserProfile = null) => {
    try {
      localStorage.setItem("token", token);
      if (partnerUserProfile) {
        localStorage.setItem("userProfile", JSON.stringify(partnerUserProfile));
      }
    } catch {
      /* ignore storage errors */
    }
    // Clear any previous forced-logout flag for this tab when logging in locally
    try {
      sessionStorage.removeItem("loggedOutByOtherTab");
    } catch {
      /* ignore */
    }
    setToken(token);

    if (partnerUserProfile) {
      setUserProfile(partnerUserProfile);
    } else {
      // If no profile provided, fetch it after setting the token
      setUserProfile(null);
      // We'll fetch the profile in a separate call after the token is set
    }

    // Properties will be fetched automatically by the useEffect below
  }, []);

  // ✅ Update user profile locally
  const updateProfile = useCallback(
    (newData) => {
      const updated = { ...userProfile, ...newData };
      setUserProfile(updated);
      localStorage.setItem("userProfile", JSON.stringify(updated));
    },
    [userProfile]
  );

  // ✅ Refresh user profile from server
  const refreshProfile = useCallback(async () => {
    if (!userProfile?.partnerId) {
      return null;
    }

    try {
      const response = await getPartnerProfile(userProfile.partnerId);
      const profileData =
        response.data?.data?.partnerUserProfile ||
        response.data?.partnerUserProfile ||
        response.data;

      if (profileData) {
        setUserProfile(profileData);
        localStorage.setItem("userProfile", JSON.stringify(profileData));
        return profileData;
      }
    } catch {
      return null;
    }
  }, [userProfile?.partnerId]);

  // ✅ Refresh properties from server (call this after property changes)
  const refreshProperties = useCallback(async () => {
    return await fetchProperties();
  }, [fetchProperties]);

  // Keep a ref to the current token so the storage handler can compare
  // without needing to include `token` in the effect deps.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // ✅ Listen for login/logout across tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      // We're interested in token/profile changes across tabs
      const watchedKeys = ["token", "userProfile"];
      if (event && !watchedKeys.includes(event.key)) return;

      // Read the authoritative values from localStorage
      const newToken = localStorage.getItem("token");
      let rawProfile = localStorage.getItem("userProfile") || null;
      let newProfile = null;
      try {
        newProfile = rawProfile ? JSON.parse(rawProfile) : null;
      } catch {
        newProfile = null;
      }

      // If token removed in another tab -> logout locally
      if (!newToken) {
        setToken(null);
        setUserProfile(null);
        return;
      }

      // If a different token exists in storage (someone logged in as a different
      // user in another tab), force-logout this tab so the user won't continue
      // with an outdated session.
      if (tokenRef.current && newToken && newToken !== tokenRef.current) {
        // Mark this tab as force-logged-out so reload won't re-authenticate it
        try {
          sessionStorage.setItem("loggedOutByOtherTab", "1");
        } catch {
          /* ignore */
        }
        setToken(null);
        setUserProfile(null);
        return;
      }

      // Otherwise update local state so current tab reflects the new login
      setToken(newToken);
      setUserProfile(newProfile);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Monitor profile changes
  useEffect(() => {
    // Profile monitoring for debugging purposes
  }, [userProfile]);

  // On mount: if there's no token, ensure we are logged out
  // Note: We don't require profile immediately as it can be fetched after login
  useEffect(() => {
    try {
      const tokenInStorage = localStorage.getItem("token");
      if (!tokenInStorage) {
        // call logout to normalize state
        logout();
      }
    } catch {
      // ignore storage access errors
    }
  }, [logout]);

  // Refresh profile from server when we have a token (on mount/refresh or login)
  useEffect(() => {
    if (token) {
      // Always fetch fresh profile from server when we have a token
      // This handles both: 1) fresh login, 2) page refresh with existing token
      fetchProfileAfterLogin(token);
    }
  }, [token, fetchProfileAfterLogin]);

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
