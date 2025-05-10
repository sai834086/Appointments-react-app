import styles from "./SignupPage.module.css";
import React, { useState } from "react";
import Logo from "../components/Logo";
import { NavLink } from "react-router-dom";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8010",
});

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !confirmPassword ||
      !password
    ) {
      setError("(*) Marked fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Both Password fields must match");
      return;
    }

    setLoading(true);
    try {
      const signUpResponse = await api.post("/Appointments/UserSignUp", {
        firstName,
        lastName,
        email,
        phoneNumber,
        dob,
        address,
        password,
      });
      if (signUpResponse.data.message === "Success") {
        alert("Sign up Successfull, Please Login");
        navigate("/login");
      } else {
        alert("Server busy please try again");
        return;
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        setError(error.response.data.message || "please try again.");
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
              <NavLink to="/login">
                <Button name={"Login"} />
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Sign up</h2>
        <form onSubmit={handleSignup} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="fName">First Name</label>
            <input
              type="text"
              id="fName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lName">Last Name</label>
            <input
              type="text"
              id="lName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phNumber">Phone Number</label>
            <input
              type="text"
              id="phNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="Date of Birth"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
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
          <div className={styles.formGroup}>
            <label htmlFor="confirm">Confirm Password</label>
            <input
              type="password"
              id="confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
