import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/adminpages/AdminLogin";
import AdminDashboard from "./pages/adminpages/AdminDashboard";
import ProtectedAdminRoute from "./pages/adminpages/ProtectedAdminRoute";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}
