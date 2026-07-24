import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import PartnerLayout from "../../components/partnercomponent/PartnerLayout";

// Each role's login page and dashboard route. Used both to redirect
// logged-out visitors to the right login, and to fence a logged-in session
// away from another role's dashboard.
const LOGIN_PATH_BY_ROLE = {
  partner: "/partner/login",
  manager: "/partner/manager/login",
  receptionist: "/partner/receptionist/login",
};
const DASHBOARD_PATH_BY_ROLE = {
  partner: "/partner/dashboard",
  manager: "/partner/manager/dashboard",
  receptionist: "/partner/receptionist/dashboard",
};
// The set of *other* roles' dashboard paths, keyed by path, so we can detect
// "this session is on someone else's dashboard" in O(1).
const ALL_DASHBOARD_PATHS = new Set(Object.values(DASHBOARD_PATH_BY_ROLE));

// Receptionists get a self-contained, sidebar-free page (see
// ReceptionistDashboard) rather than the shared PartnerLayout shell.
const ROLES_WITHOUT_SIDEBAR = new Set(["receptionist"]);

// Wraps every protected partner / manager / receptionist route. Responsibilities:
//   1. Bounce to the right login page when there's no session.
//   2. Enforce role-based access: a session can't reach another role's
//      dashboard (manager can't reach /partner/dashboard, receptionist can't
//      reach /partner/manager/dashboard, etc.).
//   3. Apply the PartnerLayout (sidebar + content shell) for partner/manager
//      screens; receptionists render their page directly since it has its
//      own minimal chrome.
export default function ProtectedPartnerRoute({ children }) {
  const { partnerProfile, token, userType } = useContext(PartnerAuthContext);
  const location = useLocation();

  // If we have neither token nor profile, redirect to the appropriate login.
  // (If we have a token but no profile yet, allow access — profile may still
  // be loading.)
  if (!token && !partnerProfile) {
    const loginPath = LOGIN_PATH_BY_ROLE[userType] || LOGIN_PATH_BY_ROLE.partner;
    return <Navigate to={loginPath} replace />;
  }

  // Role-based route fencing: a session is confined to its own role's
  // dashboard and can't reach another role's.
  const ownDashboard = DASHBOARD_PATH_BY_ROLE[userType] || DASHBOARD_PATH_BY_ROLE.partner;
  if (
    ALL_DASHBOARD_PATHS.has(location.pathname) &&
    location.pathname !== ownDashboard
  ) {
    return <Navigate to={ownDashboard} replace />;
  }

  if (ROLES_WITHOUT_SIDEBAR.has(userType)) {
    return children;
  }

  return <PartnerLayout>{children}</PartnerLayout>;
}
