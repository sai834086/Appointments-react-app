import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ApplicationHomePage from "./pages/ApplicationHomePage";
import DashBoard from "./pages/DashBoard";
import styles from "./index.module.css";
import PartnerSignUp from "./pages/PartnerSignUp";

export default function App() {
  return (
    <BrowserRouter className={styles.app}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/userSignup" element={<SignupPage />} />
        <Route path="/App" element={<ApplicationHomePage />}>
          <Route path="/App/Home" element={<ApplicationHomePage />} />
        </Route>
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/partnersignup" element={<PartnerSignUp />} />
      </Routes>
    </BrowserRouter>
  );
}
