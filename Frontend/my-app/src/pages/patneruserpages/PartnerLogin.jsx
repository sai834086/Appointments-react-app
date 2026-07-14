import styles from "./PartnerLogin.module.css";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import {
  loginPartner,
  verifyPartnerLoginOtp,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPartnerPassword,
} from "../../api/authService";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants + small helpers
// ---------------------------------------------------------------------------

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).*$/;
const REMEMBER_KEY = "partnerLogin.rememberedUserName";

const PASSWORD_CHECKS = [
  { key: "length", label: "8-20 characters", test: (p) => p.length >= 8 && p.length <= 20 },
  { key: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "digit", label: "One number", test: (p) => /\d/.test(p) },
  { key: "special", label: "One special character (@#$%^&+=!)", test: (p) => /[@#$%^&+=!]/.test(p) },
];

const getApiMessage = (err, fallback) => err?.response?.data?.message || fallback;

const emptyOtp = () => Array(OTP_LENGTH).fill("");

/* localStorage can throw in private-browsing / locked-down contexts,
   so every access is wrapped. */
const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* non-fatal */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* non-fatal */
    }
  },
};

// ---------------------------------------------------------------------------
// useCountdown — resend-cooldown timer with guaranteed cleanup on unmount
// ---------------------------------------------------------------------------

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback((from = OTP_RESEND_COOLDOWN_SECONDS) => {
    clearInterval(timerRef.current);
    setSeconds(from);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    setSeconds(0);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { seconds, start, reset };
}

// ---------------------------------------------------------------------------
// OtpInput — array-backed 6-box code input with smart backspace, arrow-key
// navigation, and paste that always fills from the first box.
// ---------------------------------------------------------------------------

function OtpInput({ digits, onDigitsChange, onComplete, disabled, hasError }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const fireIfComplete = (next) => {
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onDigitsChange(next);
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    fireIfComplete(next);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (digits[index]) {
        next[index] = "";
        onDigitsChange(next);
      } else if (index > 0) {
        next[index - 1] = "";
        onDigitsChange(next);
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || "");
    onDigitsChange(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    fireIfComplete(next);
  };

  return (
    <div className={styles.otpInputs} onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`${styles.otpBox} ${hasError ? styles.otpBoxError : ""}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of verification code`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PasswordInput — input + visibility toggle + optional Caps Lock warning
// ---------------------------------------------------------------------------

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  invalid,
  autoFocus,
  onFocus,
  onBlur,
  showCapsHint = false,
}) {
  const [show, setShow] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const trackCapsLock = (e) => {
    if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
  };

  return (
    <>
      <div className={styles.inputBox}>
        <input
          type={show ? "text" : "password"}
          id={id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={(e) => {
            setCapsOn(false);
            onBlur?.(e);
          }}
          onKeyDown={trackCapsLock}
          onKeyUp={trackCapsLock}
          className={`${styles.input} ${styles.passwordInput} ${
            invalid ? styles.inputInvalid : ""
          }`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(invalid)}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className={styles.togglePassword}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showCapsHint && capsOn && (
        <p className={styles.capsHint}>
          <AlertTriangle size={13} aria-hidden="true" />
          Caps Lock is on
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// FieldError — consistent inline error row under a field
// ---------------------------------------------------------------------------

function FieldError({ children }) {
  if (!children) return null;
  return <p className={styles.fieldError}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PartnerLogin() {
  // "credentials" | "otp" | "forgotEmail" | "forgotOtp" | "forgotReset" | "resetSuccess"
  const [step, setStep] = useState("credentials");

  const [credentials, setCredentials] = useState(() => ({
    userName: storage.get(REMEMBER_KEY) || "",
    password: "",
  }));
  const [rememberMe, setRememberMe] = useState(() => Boolean(storage.get(REMEMBER_KEY)));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login OTP — the same 6-digit code was emailed AND texted; either works.
  const [otpContact, setOtpContact] = useState({ email: "", phoneNumber: "" });
  const [otpDigits, setOtpDigits] = useState(emptyOtp);
  const [otpError, setOtpError] = useState(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSession, setOtpSession] = useState(0); // remounts OtpInput on send/resend
  const loginCooldown = useCountdown();

  // Forgot password — email -> OTP -> new password.
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState(null);
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotOtpDigits, setForgotOtpDigits] = useState(emptyOtp);
  const [forgotOtpError, setForgotOtpError] = useState(null);
  const [forgotOtpVerifying, setForgotOtpVerifying] = useState(false);
  const [forgotOtpSession, setForgotOtpSession] = useState(0);
  const forgotCooldown = useCountdown();
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Guards against double OTP auto-submission (typing + paste racing).
  const otpBusyRef = useRef(false);

  const navigate = useNavigate();
  const { login } = useContext(PartnerAuthContext);

  const completeLogin = async (data) => {
    if (rememberMe) {
      storage.set(REMEMBER_KEY, credentials.userName.trim());
    } else {
      storage.remove(REMEMBER_KEY);
    }
    // Backend may return only a token; the profile is fetched automatically.
    await login(data.token, data.partnerUserProfile || null, "partner");
    navigate("/partner/dashboard");
  };

  // ------------------------------------------------------------------
  // Password login + its OTP step
  // ------------------------------------------------------------------

  const handleChange = (field) => (e) => {
    setCredentials((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
    if (error) setError(null);
  };

  const validate = () => {
    const next = {};
    if (!credentials.userName.trim()) {
      next.userName = "Enter your email or phone number";
    }
    if (!credentials.password) {
      next.password = "Enter your password";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  // Step 1: validate email/phone + password. On success the backend doesn't
  // return a token yet — it sends a 6-digit code to both the account's email
  // and phone. Also used by "Resend code", since sending the code IS what
  // this call does. Returns a discriminated result so each caller can route
  // errors to the right surface (banner vs. OTP-step error).
  const requestLoginOtp = async () => {
    const payload = {
      userName: credentials.userName.trim(),
      password: credentials.password,
      role: "PARTNER",
    };
    const response = await loginPartner(payload);
    const resp = response?.data || {};
    const data = resp.data;

    if (resp.success && data?.requiresOtp) return { status: "otp", data };
    if (resp.success && data?.token) return { status: "token", data }; // defensive fallback
    return { status: "error", message: resp.message || "Invalid username or password" };
  };

  const enterOtpStep = (data) => {
    setOtpContact({ email: data.email, phoneNumber: data.phoneNumber });
    setOtpDigits(emptyOtp());
    setOtpError(null);
    setOtpSession((n) => n + 1);
    setStep("otp");
    loginCooldown.start();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setError(null);

    if (!navigator.onLine) {
      setError("No internet connection. Check your network and try again.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestLoginOtp();
      if (result.status === "otp") {
        enterOtpStep(result.data);
      } else if (result.status === "token") {
        await completeLogin(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(
        err.response?.data
          ? getApiMessage(err, "Invalid username or password")
          : "Something went wrong, please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loginCooldown.seconds > 0 || loading) return;
    setOtpError(null);
    setLoading(true);
    try {
      const result = await requestLoginOtp();
      if (result.status === "otp") {
        setOtpDigits(emptyOtp());
        setOtpSession((n) => n + 1);
        loginCooldown.start();
      } else if (result.status === "token") {
        await completeLogin(result.data);
      } else {
        setOtpError(result.message);
      }
    } catch (err) {
      setOtpError(getApiMessage(err, "Couldn't resend the code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    loginCooldown.reset();
    setStep("credentials");
    setOtpDigits(emptyOtp());
    setOtpError(null);
  };

  const submitLoginOtp = async (code) => {
    if (otpBusyRef.current) return;
    otpBusyRef.current = true;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      const response = await verifyPartnerLoginOtp(credentials.userName.trim(), code);
      const resp = response?.data || {};
      const data = resp.data;

      if (resp.success && data?.token) {
        await completeLogin(data);
        return;
      }
      setOtpError(resp.message || "Something went wrong. Please try again.");
    } catch (err) {
      setOtpError(getApiMessage(err, "Incorrect code. Please try again."));
    } finally {
      otpBusyRef.current = false;
      setOtpVerifying(false);
    }
  };

  // ------------------------------------------------------------------
  // Forgot password
  // ------------------------------------------------------------------

  const handleStartForgotPassword = () => {
    setError(null);
    // Prefill with whatever they already typed, if it looks like an email.
    setForgotEmail(
      EMAIL_PATTERN.test(credentials.userName.trim()) ? credentials.userName.trim() : "",
    );
    setForgotEmailError(null);
    setStep("forgotEmail");
  };

  const sendForgotOtp = async () => {
    const email = forgotEmail.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setForgotEmailError("Enter a valid email address");
      return false;
    }
    if (!navigator.onLine) {
      setForgotEmailError("No internet connection. Check your network and try again.");
      return false;
    }
    await sendForgotPasswordOtp(email);
    return true;
  };

  const handleSendForgotOtp = async (event) => {
    event?.preventDefault();
    if (forgotSending) return;
    setForgotSending(true);
    setForgotEmailError(null);
    try {
      const ok = await sendForgotOtp();
      if (!ok) return;
      setForgotOtpDigits(emptyOtp());
      setForgotOtpError(null);
      setForgotOtpSession((n) => n + 1);
      setStep("forgotOtp");
      forgotCooldown.start();
    } catch (err) {
      setForgotEmailError(getApiMessage(err, "Couldn't send the code. Please try again."));
    } finally {
      setForgotSending(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (forgotCooldown.seconds > 0) return;
    setForgotOtpError(null);
    try {
      const ok = await sendForgotOtp();
      if (ok) {
        setForgotOtpDigits(emptyOtp());
        setForgotOtpSession((n) => n + 1);
        forgotCooldown.start();
      }
    } catch (err) {
      setForgotOtpError(getApiMessage(err, "Couldn't resend the code. Please try again."));
    }
  };

  const handleBackToForgotEmail = () => {
    forgotCooldown.reset();
    setStep("forgotEmail");
    setForgotOtpDigits(emptyOtp());
    setForgotOtpError(null);
  };

  const submitForgotOtp = async (code) => {
    if (otpBusyRef.current) return;
    otpBusyRef.current = true;
    setForgotOtpVerifying(true);
    setForgotOtpError(null);
    try {
      const response = await verifyForgotPasswordOtp(forgotEmail.trim(), code);
      const resp = response?.data || {};
      const data = resp.data;

      if (resp.success && data?.resetToken) {
        setResetToken(data.resetToken);
        setNewPassword("");
        setConfirmPassword("");
        setResetErrors({});
        setStep("forgotReset");
        return;
      }
      setForgotOtpError(resp.message || "Something went wrong. Please try again.");
    } catch (err) {
      setForgotOtpError(getApiMessage(err, "Incorrect code. Please try again."));
    } finally {
      otpBusyRef.current = false;
      setForgotOtpVerifying(false);
    }
  };

  const validateNewPassword = () => {
    const next = {};
    if (
      newPassword.length < 8 ||
      newPassword.length > 20 ||
      !PASSWORD_PATTERN.test(newPassword)
    ) {
      next.newPassword =
        "8-20 characters, with an uppercase letter, lowercase letter, number, and special character (@#$%^&+=!)";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setResetErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!validateNewPassword()) return;

    setResetSubmitting(true);
    try {
      const response = await resetPartnerPassword(resetToken, newPassword, confirmPassword);
      const resp = response?.data || {};

      if (resp.success) {
        setResetToken(null);
        setNewPassword("");
        setConfirmPassword("");
        setStep("resetSuccess");
        return;
      }
      setResetErrors({
        form: resp.message || "Couldn't reset your password. Please try again.",
      });
    } catch (err) {
      setResetErrors({
        form: getApiMessage(err, "Couldn't reset your password. Please try again."),
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    setCredentials({ userName: forgotEmail, password: "" });
    setForgotEmail("");
    setFieldErrors({});
    setError(null);
    setStep("credentials");
  };

  const forgotStepNumber = { forgotEmail: 1, forgotOtp: 2, forgotReset: 3 }[step];

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark} aria-hidden="true">
            <Building2 size={22} />
          </div>
        </div>

        <div className={styles.card} key={step}>
          {step === "credentials" && (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.heading}>Sign in to your account</h1>
                <p className={styles.subheading}>Manage your business and appointments</p>
              </div>

              <form className={styles.form} onSubmit={handleLogin} noValidate>
                <div className={styles.field}>
                  <label htmlFor="userName" className={styles.label}>
                    Email or phone number
                  </label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={credentials.userName}
                    onChange={handleChange("userName")}
                    className={`${styles.input} ${
                      fieldErrors.userName ? styles.inputInvalid : ""
                    }`}
                    placeholder="you@business.com"
                    autoComplete="username"
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.userName)}
                  />
                  <FieldError>{fieldErrors.userName}</FieldError>
                </div>

                <div className={styles.field}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    value={credentials.password}
                    onChange={handleChange("password")}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    invalid={fieldErrors.password}
                    showCapsHint
                  />
                  <FieldError>{fieldErrors.password}</FieldError>
                </div>

                <div className={styles.optionsRow}>
                  <label className={styles.rememberLabel}>
                    <input
                      type="checkbox"
                      className={styles.rememberCheckbox}
                      checked={rememberMe}
                      onChange={(e) => {
                        setRememberMe(e.target.checked);
                        if (!e.target.checked) storage.remove(REMEMBER_KEY);
                      }}
                      disabled={loading}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className={styles.inlineLink}
                    onClick={handleStartForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
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
                    "Sign in"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToCredentials}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Back
              </button>

              <div className={styles.formHeader}>
                <h1 className={styles.heading}>Check your email</h1>
                <p className={styles.subheading}>
                  We sent a 6-digit code to <strong>{otpContact.email}</strong> and{" "}
                  <strong>{otpContact.phoneNumber}</strong>
                </p>
              </div>

              <div className={styles.otpBlock}>
                <OtpInput
                  key={`login-otp-${otpSession}`}
                  digits={otpDigits}
                  onDigitsChange={(next) => {
                    setOtpDigits(next);
                    setOtpError(null);
                  }}
                  onComplete={submitLoginOtp}
                  disabled={otpVerifying}
                  hasError={Boolean(otpError)}
                />
                {otpError && (
                  <div className={styles.errorBanner} role="alert">
                    {otpError}
                  </div>
                )}
                {otpVerifying ? (
                  <p className={styles.mutedText}>Verifying…</p>
                ) : (
                  <p className={styles.mutedText}>
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      className={styles.inlineLink}
                      onClick={handleResendOtp}
                      disabled={loginCooldown.seconds > 0 || loading}
                    >
                      {loading
                        ? "Sending…"
                        : loginCooldown.seconds > 0
                          ? `Resend (${loginCooldown.seconds}s)`
                          : "Resend"}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {step === "forgotEmail" && (
            <>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToCredentials}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Back to sign in
              </button>

              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step {forgotStepNumber} of 3</p>
                <h1 className={styles.heading}>Reset your password</h1>
                <p className={styles.subheading}>
                  Enter your account email and we&apos;ll send you a 6-digit code
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSendForgotOtp} noValidate>
                <div className={styles.field}>
                  <label htmlFor="forgotEmail" className={styles.label}>
                    Email address
                  </label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotEmailError(null);
                    }}
                    className={`${styles.input} ${
                      forgotEmailError ? styles.inputInvalid : ""
                    }`}
                    placeholder="you@business.com"
                    autoComplete="email"
                    disabled={forgotSending}
                    aria-invalid={Boolean(forgotEmailError)}
                    autoFocus
                  />
                  <FieldError>{forgotEmailError}</FieldError>
                </div>

                <button type="submit" className={styles.button} disabled={forgotSending}>
                  {forgotSending ? (
                    <>
                      <span className={styles.spinner} />
                      Sending…
                    </>
                  ) : (
                    "Send code"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "forgotOtp" && (
            <>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToForgotEmail}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Back
              </button>

              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step {forgotStepNumber} of 3</p>
                <h1 className={styles.heading}>Enter your code</h1>
                <p className={styles.subheading}>
                  We sent a 6-digit code to <strong>{forgotEmail}</strong>
                </p>
              </div>

              <div className={styles.otpBlock}>
                <OtpInput
                  key={`forgot-otp-${forgotOtpSession}`}
                  digits={forgotOtpDigits}
                  onDigitsChange={(next) => {
                    setForgotOtpDigits(next);
                    setForgotOtpError(null);
                  }}
                  onComplete={submitForgotOtp}
                  disabled={forgotOtpVerifying}
                  hasError={Boolean(forgotOtpError)}
                />
                {forgotOtpError && (
                  <div className={styles.errorBanner} role="alert">
                    {forgotOtpError}
                  </div>
                )}
                {forgotOtpVerifying ? (
                  <p className={styles.mutedText}>Verifying…</p>
                ) : (
                  <p className={styles.mutedText}>
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      className={styles.inlineLink}
                      onClick={handleResendForgotOtp}
                      disabled={forgotCooldown.seconds > 0}
                    >
                      {forgotCooldown.seconds > 0
                        ? `Resend (${forgotCooldown.seconds}s)`
                        : "Resend"}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {step === "forgotReset" && (
            <>
              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step {forgotStepNumber} of 3</p>
                <h1 className={styles.heading}>Set a new password</h1>
                <p className={styles.subheading}>
                  Choose a new password for <strong>{forgotEmail}</strong>
                </p>
              </div>

              <form className={styles.form} onSubmit={handleResetPassword} noValidate>
                <div className={styles.field}>
                  <label htmlFor="newPassword" className={styles.label}>
                    New password
                  </label>
                  <div className={styles.passwordFieldWrapper}>
                    <PasswordInput
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, newPassword: null, form: null }));
                      }}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                      placeholder="Enter a new password"
                      autoComplete="new-password"
                      disabled={resetSubmitting}
                      invalid={resetErrors.newPassword}
                      autoFocus
                    />
                    {(newPasswordFocused || newPassword) &&
                      (() => {
                        const pendingChecks = PASSWORD_CHECKS.filter(
                          (c) => !c.test(newPassword),
                        );
                        if (pendingChecks.length === 0) return null;
                        return (
                          <ul className={styles.passwordChecklist}>
                            {pendingChecks.map((c) => (
                              <li key={c.key} className={styles.checkPending}>
                                <span className={styles.checkDot} aria-hidden="true" />
                                {c.label}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                  </div>
                  {resetErrors.newPassword && !newPassword && (
                    <FieldError>{resetErrors.newPassword}</FieldError>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm new password
                  </label>
                  <div className={styles.passwordFieldWrapper}>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setResetErrors((prev) => ({
                          ...prev,
                          confirmPassword: null,
                          form: null,
                        }));
                      }}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      disabled={resetSubmitting}
                      invalid={resetErrors.confirmPassword}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <div className={styles.popoverError}>Passwords don&apos;t match yet</div>
                    )}
                  </div>
                  {resetErrors.confirmPassword && !confirmPassword && (
                    <FieldError>{resetErrors.confirmPassword}</FieldError>
                  )}
                </div>

                {resetErrors.form && (
                  <div className={styles.errorBanner} role="alert" aria-live="polite">
                    {resetErrors.form}
                  </div>
                )}

                <button type="submit" className={styles.button} disabled={resetSubmitting}>
                  {resetSubmitting ? (
                    <>
                      <span className={styles.spinner} />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "resetSuccess" && (
            <div className={styles.successBlock}>
              <div className={styles.successIcon} aria-hidden="true">
                <CheckCircle2 size={28} strokeWidth={2} />
              </div>
              <div className={styles.formHeader}>
                <h1 className={styles.heading}>Password updated</h1>
                <p className={styles.subheading}>
                  Your password has been updated. Sign in with your new password.
                </p>
              </div>
              <button type="button" className={styles.button} onClick={handleGoToSignIn}>
                Sign in
              </button>
            </div>
          )}
        </div>

        {step === "credentials" && (
          <p className={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Link to="/partner/signup" className={styles.footerLink}>
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
