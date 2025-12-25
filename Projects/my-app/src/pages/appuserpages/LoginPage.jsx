import styles from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authService";
import { useState, useContext } from "react";
import { UserContext } from "./context/UserContext";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    userName: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

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
      const loginResponse = await loginUser(credentials);

      const data = loginResponse.data;
      if (data.success) {
        if (data.data.token) {
          await login(data.data.token);
          navigate("/dashboard");
          return;
        }
      }
    } catch (error) {
      console.log("Login error response:", error);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleLogin}>
        <h2 className={styles.heading}>Welcome Back</h2>

        <div className={styles.inputGroup}>
          <label htmlFor="userName">
            Username
            <input
              id="userName"
              type="text"
              value={credentials.userName}
              onChange={(e) =>
                setCredentials({ ...credentials, userName: e.target.value })
              }
              name="userName"
              className={styles.input}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </label>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              name="password"
              className={styles.input}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Sign In"}
        </button>

        <div className={styles.signupPrompt}>
          Don't have an account? <a href="/signup">Sign up here</a>
        </div>
      </form>
    </div>
  );
}
