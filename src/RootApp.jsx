// src/RootApp.jsx
import { useLocation } from "react-router-dom";
import UserApp from "./UserApp";
import PartnerApp from "./PartnerApp";
import { UserProvider } from "./pages/appuserpages/context/UserProvider.jsx";
import { PartnerAuthProvider } from "./pages/patneruserpages/context/PartnerAuthProvider";

export default function RootApp() {
  const location = useLocation();
  if (location.pathname.startsWith("/partner")) {
    return (
      <PartnerAuthProvider>
        <PartnerApp />
      </PartnerAuthProvider>
    );
  }
  return (
    <UserProvider>
      <UserApp />
    </UserProvider>
  );
}