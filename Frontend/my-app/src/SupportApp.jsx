import { Routes, Route } from "react-router-dom";
import SupportLogin from "./pages/supportpages/SupportLogin";
import SupportDashboard from "./pages/supportpages/SupportDashboard";
import ProtectedSupportRoute from "./pages/supportpages/ProtectedSupportRoute";

export default function SupportApp() {
  return (
    <Routes>
      <Route path="/support/login" element={<SupportLogin />} />
      <Route
        path="/support/dashboard"
        element={
          <ProtectedSupportRoute>
            <SupportDashboard />
          </ProtectedSupportRoute>
        }
      />
    </Routes>
  );
}
