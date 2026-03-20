import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";

export default function ProtectedRoute({ children }) {
  const { token } = useContext(UserContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
