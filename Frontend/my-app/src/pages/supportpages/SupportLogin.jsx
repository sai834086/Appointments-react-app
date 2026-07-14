import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SupportAuthContext } from "./context/SupportAuthContext";
import { loginSupport } from "../../api/supportService";
import styles from "./SupportLogin.module.css";

export default function SupportLogin() {
  const [credentials, setCredentials] = useState({ userName: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(SupportAuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!credentials.userName || !credentials.password) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await loginSupport(credentials);
      const { data } = res.data;
      login(data.token, {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate("/support/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.badge}>Support</div>
        <h2 className={styles.heading}>Sign in to Support</h2>

        <div className={styles.field}>
          <label htmlFor="userName">Email</label>
          <input
            id="userName"
            type="text"
            value={credentials.userName}
            onChange={(e) =>
              setCredentials({ ...credentials, userName: e.target.value })
            }
            placeholder="support@example.com"
            autoComplete="username"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
