// UserApp.jsx
import { Routes, Route } from "react-router-dom";
import DashBoard from "./pages/appuserpages/DashBoard";
import SignUpPage from "./pages/appuserpages/SignUpPage";
import ProtectedRoute from "./pages/appuserpages/ProtectedRoute";
import LoginPage from "./pages/appuserpages/LoginPage";
import ServicesPage from "./pages/appuserpages/ServicesPage";
import EmployeesPage from "./pages/appuserpages/EmployeesPage";
import EmployeePage from "./pages/appuserpages/EmployeePage";
import AvailabilityPage from "./pages/appuserpages/AvailabilityPage";
import AvailabilityBookingPage from "./pages/appuserpages/AvailabilityBookingPage";

export default function UserApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <EmployeePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/availability"
        element={
          <ProtectedRoute>
            <AvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/availability-booking"
        element={
          <ProtectedRoute>
            <AvailabilityBookingPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
