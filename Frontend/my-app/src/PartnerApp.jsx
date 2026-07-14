// PartnerApp.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import PartnerSignUp from "./pages/patneruserpages/PartnerSignUp";
import PartnerLogin from "./pages/patneruserpages/PartnerLogin";
import ManagerLogin from "./pages/patneruserpages/ManagerLogin";
import ReceptionistLogin from "./pages/patneruserpages/ReceptionistLogin";
import PartnerDashboard from "./pages/patneruserpages/PartnerDashboard";
import ManagerDashboard from "./pages/patneruserpages/ManagerDashboard";
import ReceptionistDashboard from "./pages/patneruserpages/ReceptionistDashboard";
import ProtectedPartnerRoute from "./pages/patneruserpages/ProtectedPartnerRoute";
import PartnerSignUpSuccessFull from "./pages/patneruserpages/PartnerSignUpSuccessFull";
import VerifyEmail from "./pages/patneruserpages/VerifyEmail";
import PartnerAccount from "./pages/patneruserpages/PartnerAccount";
import Employee from "./pages/patneruserpages/Employee";
import Availability from "./pages/patneruserpages/Availability";
import PartnerAppointments from "./pages/patneruserpages/PartnerAppointments";
import PropertyDetails from "./pages/patneruserpages/PropertyDetails";
import PropertyServices from "./pages/patneruserpages/PropertyServices";
import ManageReceptionists from "./pages/patneruserpages/ManageReceptionists";
import PartnerHelp from "./pages/patneruserpages/PartnerHelp";
import PartnerContact from "./pages/patneruserpages/PartnerContact";
import PartnerSettings from "./pages/patneruserpages/PartnerSettings";
import PartnerNotifications from "./pages/patneruserpages/PartnerNotifications";
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
      {/* Public — reached by clicking the link in the verification email,
          so the visitor is never authenticated at this point. */}
      <Route path="/partner/verify-email" element={<VerifyEmail />} />
      <Route path="/partner/login" element={<PartnerLogin />} />
      <Route path="/partner/manager/login" element={<ManagerLogin />} />
      <Route
        path="/partner/receptionist/login"
        element={<ReceptionistLogin />}
      />
      {/* Back-compat: legacy /partner/manager route now redirects to /login */}
      <Route
        path="/partner/manager"
        element={<Navigate to="/partner/manager/login" replace />}
      />
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedPartnerRoute>
            <PartnerDashboard />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/dashboard"
        element={
          <ProtectedPartnerRoute>
            <ManagerDashboard />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/receptionist/dashboard"
        element={
          <ProtectedPartnerRoute>
            <ReceptionistDashboard />
          </ProtectedPartnerRoute>
        }
      />
      {/* Alias — same page, in case anything links to "appointments" instead
          of "dashboard" for the receptionist. */}
      <Route
        path="/partner/receptionist/appointments"
        element={
          <ProtectedPartnerRoute>
            <ReceptionistDashboard />
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
        path="/partner/manager/account"
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
        path="/partner/manager/employee"
        element={
          <ProtectedPartnerRoute>
            <Employee />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/property"
        element={
          <ProtectedPartnerRoute>
            <PropertyDetails />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/property"
        element={
          <ProtectedPartnerRoute>
            <PropertyDetails />
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
      <Route
        path="/partner/manager/availability"
        element={
          <ProtectedPartnerRoute>
            <Availability />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/appointments"
        element={
          <ProtectedPartnerRoute>
            <PartnerAppointments />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/appointments"
        element={
          <ProtectedPartnerRoute>
            <PartnerAppointments />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/services"
        element={
          <ProtectedPartnerRoute>
            <PropertyServices />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/services"
        element={
          <ProtectedPartnerRoute>
            <PropertyServices />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/receptionists"
        element={
          <ProtectedPartnerRoute>
            <ManageReceptionists />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/receptionists"
        element={
          <ProtectedPartnerRoute>
            <ManageReceptionists />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/settings"
        element={
          <ProtectedPartnerRoute>
            <PartnerSettings />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/settings"
        element={
          <ProtectedPartnerRoute>
            <PartnerSettings />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/help"
        element={
          <ProtectedPartnerRoute>
            <PartnerHelp />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/help"
        element={
          <ProtectedPartnerRoute>
            <PartnerHelp />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/contact"
        element={
          <ProtectedPartnerRoute>
            <PartnerContact />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/contact"
        element={
          <ProtectedPartnerRoute>
            <PartnerContact />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/notifications"
        element={
          <ProtectedPartnerRoute>
            <PartnerNotifications />
          </ProtectedPartnerRoute>
        }
      />
      <Route
        path="/partner/manager/notifications"
        element={
          <ProtectedPartnerRoute>
            <PartnerNotifications />
          </ProtectedPartnerRoute>
        }
      />
    </Routes>
  );
}
