import styles from "./PartnerLogin.module.css";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { loginPartner, loginManager } from "../../api/authService";
import { Lock, Mail, UserCheck, Users } from "lucide-react";

export default function PartnerLogin() {
  const [credentials, setCredentials] = useState({
    userName: "",
    password: "",
  });
  const [loginType, setLoginType] = useState("partner"); // "partner" or "manager"
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(PartnerAuthContext);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (
      credentials.userName === null ||
      credentials.userName === "" ||
      credentials.password === null ||
      credentials.password === ""
    ) {
      setError("Username and password are required.");
      return;
    }

    setError(null);
    setLoading(true);

    if (!navigator.onLine) {
      setError("No internet connection");
      setLoading(false);
      return;
    }
    try {
      // Add role field based on login type
      const loginData = {
        ...credentials,
        role: loginType === "manager" ? "MANAGER" : "PARTNER",
      };

      const loginResponse = await (loginType === "manager"
        ? loginManager(loginData)
        : loginPartner(loginData));
      const resp = loginResponse?.data || {};

      const data = resp.data;

      if (resp.success) {
        // Debug: let's see what the backend is actually returning

        if (data.token) {
          // Check if profile is included in response (for backward compatibility)
          if (data.partnerUserProfile || data.managerProfile) {
            await login(
              data.token,
              data.partnerUserProfile || data.managerProfile,
              loginType,
            );
          } else {
            // Backend only returned token, profile will be fetched automatically
            await login(data.token, null, loginType);
          }

          navigate("/partner/dashboard");
          return;
        }

        setError(resp.message || "Login succeeded but no profile was returned");
        return;
      }

      // Not successful
      setError(resp.message || "Invalid username or password");
    } catch (error) {
      if (error.response?.data) {
        // Backend returned error response
        setError(error.response.data.message || "Invalid username or password");
      } else {
        // Network or unexpected error
        setError("Something went wrong, please try again later");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.formHeader}>
          <h2 className={styles.heading}>Welcome Back</h2>
          <p className={styles.subheading}>Sign in to your account</p>
        </div>

        <div className={styles.typeSelector}>
          <div
            className={`${styles.typeOption} ${
              loginType === "partner" ? styles.typeOptionActive : ""
            }`}
            onClick={() => setLoginType("partner")}
          >
            <input
              type="radio"
              value="partner"
              checked={loginType === "partner"}
              onChange={(e) => setLoginType(e.target.value)}
              className={styles.radioInput}
            />
            <UserCheck size={18} />
            <span>Partner User</span>
          </div>
          <div
            className={`${styles.typeOption} ${
              loginType === "manager" ? styles.typeOptionActive : ""
            }`}
            onClick={() => setLoginType("manager")}
          >
            <input
              type="radio"
              value="manager"
              checked={loginType === "manager"}
              onChange={(e) => setLoginType(e.target.value)}
              className={styles.radioInput}
            />
            <Users size={18} />
            <span>Manager</span>
          </div>
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.inputGroupNew}>
            <label htmlFor="userName" className={styles.labelNew}>
              Username
            </label>
            <div className={styles.inputBox}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="text"
                id="userName"
                value={credentials.userName}
                onChange={(e) =>
                  setCredentials({ ...credentials, userName: e.target.value })
                }
                name="userName"
                className={styles.inputNew}
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className={styles.inputGroupNew}>
            <label htmlFor="password" className={styles.labelNew}>
              Password
            </label>
            <div className={styles.inputBox}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                id="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                name="password"
                className={styles.inputNew}
                placeholder="Enter your password"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.error}>{error}</p>
          </div>
        )}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <div className={styles.signupSection}>
          <p>
            Don't have an account?{" "}
            <a href="/partner/signup" className={styles.signupLink}>
              Create one
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
