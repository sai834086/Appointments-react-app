import styles from "./PartnerLogin.module.css";
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { loginReceptionist } from "../../api/authService";
import { Headset, Eye, EyeOff } from "lucide-react";

/**
 * Dedicated login page for property receptionists. Lives at
 * /partner/receptionist/login. Receptionists authenticate through the
 * receptionist/login endpoint and are routed to their read-only
 * appointments view for their single assigned property.
 */
export default function ReceptionistLogin() {
  const [credentials, setCredentials] = useState({ userName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(PartnerAuthContext);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!credentials.userName.trim() || !credentials.password) {
      setError("Email and password are required.");
      return;
    }

    setError(null);

    if (!navigator.onLine) {
      setError("No internet connection. Check your network and try again.");
      return;
    }

    setLoading(true);
    try {
      const loginData = {
        userName: credentials.userName.trim(),
        password: credentials.password,
        role: "RECEPTIONIST",
      };
      const loginResponse = await loginReceptionist(loginData);
      const resp = loginResponse?.data || {};
      const data = resp.data;

      if (resp.success && data?.token) {
        const profile = data.receptionistProfile || data.partnerUserProfile || null;
        await login(data.token, profile, "receptionist");
        navigate("/partner/receptionist/dashboard");
        return;
      }
      setError(resp.message || "Invalid username or password");
    } catch (err) {
      if (err.response?.data) {
        setError(err.response.data.message || "Invalid username or password");
      } else {
        setError("Something went wrong, please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark} aria-hidden="true">
            <Headset size={22} />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.formHeader}>
            <h1 className={styles.heading}>Receptionist sign in</h1>
            <p className={styles.subheading}>
              Sign in to view appointments for your assigned property
            </p>
          </div>

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <div className={styles.field}>
              <label htmlFor="userName" className={styles.label}>
                Email
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={credentials.userName}
                onChange={(e) => {
                  setCredentials((prev) => ({ ...prev, userName: e.target.value }));
                  if (error) setError(null);
                }}
                className={styles.input}
                placeholder="you@example.com"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputBox}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={(e) => {
                    setCredentials((prev) => ({ ...prev, password: e.target.value }));
                    if (error) setError(null);
                  }}
                  className={`${styles.input} ${styles.passwordInput}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Signing in…
                </>
              ) : (
                "Sign in as Receptionist"
              )}
            </button>
          </form>
        </div>

        <p className={styles.footerText}>
          Are you a partner?{" "}
          <Link to="/partner/login" className={styles.footerLink}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
