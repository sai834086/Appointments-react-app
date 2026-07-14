import supportApi from "./supportApi";
import api from "./api";

// login uses the public api (no auth header needed)
export const loginSupport = (credentials) =>
  api.post("support/login", credentials);

export const getAllUsers = () => supportApi.get("support/users");

export const getUserDetail = (userId) =>
  supportApi.get(`support/users/${userId}`);

// Partners
export const getAllPartners = () => supportApi.get("support/partners");

export const verifyPartner = (partnerId) =>
  supportApi.patch(`support/partners/${partnerId}/verify`);
