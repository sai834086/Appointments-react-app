import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SupportAuthContext } from "./context/SupportAuthContext";

export default function ProtectedSupportRoute({ children }) {
  const { token } = useContext(SupportAuthContext);
  if (!token) return <Navigate to="/support/login" replace />;
  return children;
}
