// PartnerApp.jsx
import { Routes, Route } from "react-router-dom";
import PartnerSignUp from "./pages/patneruserpages/PartnerSignUp";
import PartnerLogin from "./pages/patneruserpages/PartnerLogin";
import PartnerDashboard from "./pages/patneruserpages/PartnerDashboard";
import ProtectedPartnerRoute from "./pages/patneruserpages/ProtectedPartnerRoute";
import PartnerSignUpSuccessFull from "./pages/patneruserpages/PartnerSignUpSuccessFull";
import PartnerAccount from "./pages/patneruserpages/PartnerAccount";
import Employee from "./pages/patneruserpages/Employee";
import Availability from "./pages/patneruserpages/Availability";
import { useContext } from "react";
import { PartnerAuthContext } from "./pages/patneruserpages/context/PartnerAuthContext";

export default function PartnerApp() {
  const { partnerProfile } = useContext(PartnerAuthContext) || {};
  return (
    <Routes>
      <Route path="/partner/signup" element={<PartnerSignUp />} />
      <Route
        path="/partner/signup/success"
        element={<PartnerSignUpSuccessFull />}
      />
      <Route path="/partner/login" element={<PartnerLogin />} />
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedPartnerRoute>
            <PartnerDashboard />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/account"
        element={
          <ProtectedPartnerRoute>
            <PartnerAccount partnerProfile={partnerProfile} />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/employee"
        element={
          <ProtectedPartnerRoute>
            <Employee />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/availability"
        element={
          <ProtectedPartnerRoute>
            <Availability />
          </ProtectedPartnerRoute>
        }
      />
    </Routes>
  );
}
