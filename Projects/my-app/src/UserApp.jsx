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
import RescheduleBookingPage from "./pages/appuserpages/RescheduleBookingPage";
import BookingsPage from "./pages/appuserpages/BookingsPage";
import AccountPage from "./pages/appuserpages/AccountPage";
import ProfilePage from "./pages/appuserpages/ProfilePage";

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
      <Route
        path="/reschedule-booking"
        element={
          <ProtectedRoute>
            <RescheduleBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
