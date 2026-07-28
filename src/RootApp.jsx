// src/RootApp.jsx
import { useLocation, Navigate } from "react-router-dom";
import UserApp from "./UserApp";
import PartnerApp from "./PartnerApp";
import SupportApp from "./SupportApp";
import AdminApp from "./AdminApp";
import { UserProvider } from "./pages/appuserpages/context/UserProvider.jsx";
import { PartnerAuthProvider } from "./pages/patneruserpages/context/PartnerAuthProvider";
import NotificationProvider from "./pages/patneruserpages/context/NotificationProvider";
import { SupportAuthProvider } from "./pages/supportpages/context/SupportAuthProvider";
import { AdminAuthProvider } from "./pages/adminpages/context/AdminAuthProvider";

export default function RootApp() {
  const location = useLocation();
  // Convenience redirect: managers/receptionists who land on /manager/* or
  // /receptionist/* (without the /partner prefix — e.g. from a bookmark or
  // shared link) are forwarded into the partner sub-app so /manager/login
  // and /receptionist/login still work.
  if (
    location.pathname.startsWith("/manager") ||
    location.pathname.startsWith("/receptionist")
  ) {
    return (
      <Navigate
        to={`/partner${location.pathname}${location.search}`}
        replace
      />
    );
  }
  if (location.pathname.startsWith("/partner")) {
    return (
      <PartnerAuthProvider>
        <NotificationProvider>
          <PartnerApp />
        </NotificationProvider>
      </PartnerAuthProvider>
    );
  }
  if (location.pathname.startsWith("/support")) {
    return (
      <SupportAuthProvider>
        <SupportApp />
      </SupportAuthProvider>
    );
  }
  if (location.pathname.startsWith("/admin")) {
    return (
      <AdminAuthProvider>
        <AdminApp />
      </AdminAuthProvider>
    );
  }
  return (
    <UserProvider>
      <UserApp />
    </UserProvider>
  );
}