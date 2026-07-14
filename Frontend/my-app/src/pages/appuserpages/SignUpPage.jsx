import { useState } from "react";
import styles from "./SignUpPage.module.css";
import { registerUser } from "../../api/authService";
import { useNavigate } from "react-router-dom";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  address: "",
  password: "",
};

const validators = {
  firstName: (v) =>
    /^[A-Za-z ]+$/.test(v) || "First name must contain only letters",
  lastName: (v) =>
    /^[A-Za-z ]+$/.test(v) || "Last name must contain only letters",
  email: (v) =>
    /^(?:[a-zA-Z0-9+_.-]+)@(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}$/.test(v) ||
    "Invalid email",
  phoneNumber: (v) => /^\d{10}$/.test(v) || "Phone number must be 10 digits",
  password: (v) => v.length >= 8 || "Password must be at least 8 characters",
};

function validateAll(form) {
  const errors = {};
  if (!form.firstName) errors.firstName = "First name required";
  else {
    const r = validators.firstName(form.firstName);
    if (r !== true) errors.firstName = r;
  }

  if (!form.lastName) errors.lastName = "Last name required";
  else {
    const r = validators.lastName(form.lastName);
    if (r !== true) errors.lastName = r;
  }

  if (!form.email) errors.email = "Email required";
  else {
    const r = validators.email(form.email);
    if (r !== true) errors.email = r;
  }

  if (!form.phoneNumber) errors.phoneNumber = "Phone number required";
  else {
    const r = validators.phoneNumber(form.phoneNumber);
    if (r !== true) errors.phoneNumber = r;
  }

  if (!form.password) errors.password = "Password required";
  else {
    const r = validators.password(form.password);
    if (r !== true) errors.password = r;
    // additional password checks
    if (!/[A-Z]/.test(form.password))
      errors.password = "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(form.password))
      errors.password = "Password must contain at least one lowercase letter";
    if (!/\d/.test(form.password))
      errors.password = "Password must contain at least one digit";
    if (!/[@#$%^&+=!]/.test(form.password))
      errors.password =
        "Password must contain at least one special symbol (@#$%^&+=!)";
  }

  return errors;
}

export default function SignUpPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
    setMessage(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validateAll(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setMessage(null);
    if (!navigator.onLine) {
      setMessage({
        type: "error",
        text: "No internet connection",
      });
      setSubmitting(false);
      return;
    }

    try {
      const signUpResponse = await registerUser(form);

      if (signUpResponse.data.success) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      }
    } catch (error) {
      if (error.response?.data) {
        // Show the backend error
        setMessage({
          type: "error",
          text: "UserName or phone number already exists, Please login",
        });
      } else {
        // Network or unexpected error
        setMessage({
          type: "error",
          text: "Please try again later",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.signupPage}>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
      <h2 className={styles.title}>Create account</h2>

      <form className={styles.signupForm} onSubmit={onSubmit} noValidate>
        <div className={styles.row}>
          <label className={styles.formLabel}>
            First name
            <input
              className={styles.input}
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="First name"
            />
            {errors.firstName && (
              <div className={styles.error}>{errors.firstName}</div>
            )}
          </label>

          <label className={styles.formLabel}>
            Last name
            <input
              className={styles.input}
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Last name"
            />
            {errors.lastName && (
              <div className={styles.error}>{errors.lastName}</div>
            )}
          </label>
        </div>

        <label className={styles.formLabel}>
          Email
          <input
            className={styles.input}
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
          />
          {errors.email && <div className={styles.error}>{errors.email}</div>}
        </label>

        <label className={styles.formLabel}>
          Phone number
          <input
            className={styles.input}
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            placeholder="1234567890"
            maxLength={10}
          />
          {errors.phoneNumber && (
            <div className={styles.error}>{errors.phoneNumber}</div>
          )}
        </label>

        <label className={styles.formLabel}>
          Address (optional)
          <input
            className={styles.input}
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder="Street address, city"
          />
        </label>

        <label className={styles.formLabel}>
          Password
          <input
            className={styles.input}
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <div className={styles.error}>{errors.password}</div>
          )}
        </label>

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "error"
                ? styles.errorMessage
                : styles.successMessage
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
