import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import axios from "axios";
import styles from "./LoginPage.module.css";

const api = axios.create({
  baseURL: "http://localhost:8010",
});

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Both email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const loginResponse = await api.post("Appointments/UserLogin", {
        username,
        password,
      });

      console.log(loginResponse.data.token);
      if (loginResponse.data.token) {
        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify(loginResponse.data.user)
        ); // store the user directly.

        navigate("/dashboard");
      } else {
        setError("Invalid credentials.");
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        setError(
          error.response.data.message || "Login failed. Please try again."
        );
        console.error("Login error", error.response.data);
      } else if (error.request) {
        setError("Network error. Please check your connection.");
        console.error("Network error", error.request);
      } else {
        setError("An unexpected error occurred.");
        console.error("Error", error.message);
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.container}>
        <Logo />
        <nav className={styles.navbar}>
          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/userSignup">
                <Button name={"Sign Up"} />
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>

      <div className={styles.formContainer}>
        <h2 className={styles.title}>Login</h2>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className={styles.rememberMe}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label htmlFor="rememberMe">Remember Me</label>
          </div>
          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </button>
          {}
        </form>
        <div className={styles.footer}>
          <NavLink to="/forgot-password">Forgot Password?</NavLink>
        </div>
      </div>
    </div>
  );
}
