import styles from "./PartnerLogin.module.css";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { loginPartner } from "../../api/authService";

export default function PartnerLogin() {
  const [credentials, setCredentials] = useState({
    userName: "",
    password: "",
  });
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
      const loginResponse = await loginPartner(credentials);
      const resp = loginResponse?.data || {};

      const data = resp.data;

      if (resp.success) {
        // Debug: let's see what the backend is actually returning

        if (data.token) {
          // Check if profile is included in response (for backward compatibility)
          if (data.partnerUserProfile) {
            await login(data.token, data.partnerUserProfile);
          } else {
            // Backend only returned token, profile will be fetched automatically
            await login(data.token);
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
      <h1 className={styles.title}>Partner Login</h1>
      <form className={styles.form} onSubmit={handleLogin}>
        <h2 className={styles.heading}>Login</h2>
        <div className={styles.inputGroup}>
          <label htmlFor="userName" required>
            User Name:
            <input
              type="text"
              value={credentials.userName}
              onChange={(e) =>
                setCredentials({ ...credentials, userName: e.target.value })
              }
              name="userName"
              className={styles.input}
            />
          </label>
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">
            Password:
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              name="password"
              className={styles.input}
            />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div>
          Don't have an account? <a href="/partner/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
}
