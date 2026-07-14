import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./context/UserContext";

function getRolesFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.roles || [];
  } catch {
    return [];
  }
}

export default function ProtectedRoute({ children }) {
  const { token } = useContext(UserContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const roles = getRolesFromToken(token);
  if (!roles.includes("USER")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
