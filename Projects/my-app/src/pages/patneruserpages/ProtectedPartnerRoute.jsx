import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { PartnerAuthContext } from "./context/PartnerAuthContext";

// Note: import path above may need adjustment depending on where this file lives
export default function ProtectedPartnerRoute({ children }) {
  const { partnerProfile, token } = useContext(PartnerAuthContext);

  // If we have a token but no profile, allow access (profile might be loading)
  // If we have neither token nor profile, redirect to login
  if (!token && !partnerProfile) {
    return <Navigate to="/partner/login" replace />;
  }

  return children;
}
