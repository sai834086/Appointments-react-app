import axios from "axios";
import config from "../config/config";

const supportApi = axios.create({
  baseURL: config.Api_Url,
  headers: { "Content-Type": "application/json" },
});

supportApi.interceptors.request.use((cfg) => {
  // Read from sessionStorage (per-tab) with a fallback to legacy localStorage
  // so existing sessions keep working through the migration.
  let token = null;
  try {
    token = sessionStorage.getItem("supportToken");
  } catch {
    /* ignore */
  }
  if (!token) {
    try {
      token = localStorage.getItem("supportToken");
    } catch {
      /* ignore */
    }
  }
  if (token && cfg.url !== "support/login") {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export default supportApi;
