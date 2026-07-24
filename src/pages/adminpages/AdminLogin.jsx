import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthContext } from "./context/AdminAuthContext";
import { loginAdmin } from "../../api/adminService";
import styles from "./AdminLogin.module.css";

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ userName: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AdminAuthContext);
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
      const res = await loginAdmin(credentials);
      const { data } = res.data;
      const payload = decodeJwt(data.token);
      const roles = payload?.roles || [];
      if (!roles.includes("ADMIN")) {
        setError("Access denied. Admin account required.");
        return;
      }
      login(data.token, {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.badge}>Admin</div>
        <h2 className={styles.heading}>Sign in to Admin</h2>

        <div className={styles.field}>
          <label htmlFor="userName">Email</label>
          <input
            id="userName"
            type="text"
            value={credentials.userName}
            onChange={(e) =>
              setCredentials({ ...credentials, userName: e.target.value })
            }
            placeholder="admin@example.com"
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
