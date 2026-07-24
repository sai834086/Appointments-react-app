import api from "./api";
import adminApi from "./adminApi";

// Admin logs in via the regular user login endpoint.
// The JWT is then decoded client-side to verify the ADMIN role.
export const loginAdmin = (credentials) =>
  api.post("appUser/login", credentials);

export const getSupportUsers = () =>
  adminApi.get("api/admin/support-users");

export const createSupportUser = (data) =>
  adminApi.post("api/admin/create-support", data);
