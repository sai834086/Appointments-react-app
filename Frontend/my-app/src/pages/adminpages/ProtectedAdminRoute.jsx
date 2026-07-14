import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AdminAuthContext } from "./context/AdminAuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { token } = useContext(AdminAuthContext);
  return token ? children : <Navigate to="/admin/login" replace />;
}
