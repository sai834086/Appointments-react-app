import axios from "axios";
import config from "../config/config";

const api = axios.create({
  baseURL: config.Api_Url,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // ← Add this line
  },
});

// Add JWT token to all requests except login/register
api.interceptors.request.use((config) => {
  // get token from localStorage
  const token = localStorage.getItem("token");

  const skipAuth = [
    "/login",
    "/register",
    "/partnerUser/login",
    "/partnerUser/register",
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
