import axios from "axios";
import config from "../config/config";

const api = axios.create({
  baseURL: config.Api_Url,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to all requests except login/register.
// Token is read from sessionStorage (per-tab) so that having a partner tab
// and a separate user/manager tab open at the same time doesn't cause one
// session to clobber the other. We fall back to localStorage for back-compat
// with browsers that still have the legacy key from earlier versions.
api.interceptors.request.use((config) => {
  let token = null;
  try {
    token = sessionStorage.getItem("token");
  } catch {
    /* ignore storage errors */
  }
  if (!token) {
    try {
      token = localStorage.getItem("token");
    } catch {
      /* ignore */
    }
  }

  const skipAuth = [
    "/login",
    "/register",
    "/partnerUser/login",
    "/partnerUser/register",
    "/partnerUser/login/verify-otp",
    "partnerUser/login/verify-otp",
    "/partnerUser/forgot-password/send-otp",
    "partnerUser/forgot-password/send-otp",
    "/partnerUser/forgot-password/verify-otp",
    "partnerUser/forgot-password/verify-otp",
    "/partnerUser/forgot-password/reset-password",
    "partnerUser/forgot-password/reset-password",
    "/manager/login",
    "manager/login",
    "/receptionist/login",
    "receptionist/login",
    "/auth/verify-email",
    "auth/verify-email",
    "/auth/resend-verification",
    "auth/resend-verification",
    "/auth/send-otp",
    "auth/send-otp",
    "/auth/verify-otp",
    "auth/verify-otp",
    "/auth/check-phone",
    "auth/check-phone",
    "/auth/send-phone-otp",
    "auth/send-phone-otp",
    "/auth/verify-phone-otp",
    "auth/verify-phone-otp",
  ];

  // guard config.url which may be undefined in some axios usages
  const url = config && config.url ? String(config.url) : "";

  // Use exact matching to avoid "/partnerUser/register" matching "/partnerUser/registerProperty"
  const shouldSkip = skipAuth.some((s) => url === s);

  if (!shouldSkip && token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
