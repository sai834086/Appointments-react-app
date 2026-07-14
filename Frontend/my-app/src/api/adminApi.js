import axios from "axios";
import config from "../config/config";

const adminApi = axios.create({
  baseURL: config.Api_Url,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((cfg) => {
  // Read from sessionStorage (per-tab) with a fallback to legacy localStorage
  // so existing sessions keep working through the migration.
  let token = null;
  try {
    token = sessionStorage.getItem("adminToken");
  } catch {
    /* ignore */
  }
  if (!token) {
    try {
      token = localStorage.getItem("adminToken");
    } catch {
      /* ignore */
    }
  }
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export default adminApi;
