import styles from "./PartnerLogin.module.css";
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import {
  loginManager,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPartnerPassword,
} from "../../api/authService";
import { UserCog, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

/**
 * Manager login — /partner/manager/login.
 *
 * Also hosts the manager's password setup / reset flow (email -> 6-digit
 * code -> new password). The invitation email a manager receives when a
 * partner adds them links here with ?reset=1&email=..., which drops them
 * straight into that flow with their email prefilled — that's how they set
 * their own password before their first sign-in (their account is created
 * with an auto-generated one they never see).
 */

const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,20}$/;

const getApiMessage = (err, fallback) => err?.response?.data?.message || fallback;
const emptyOtp = () => Array(OTP_LENGTH).fill("");

export default function ManagerLogin() {
  // "credentials" | "forgotEmail" | "forgotOtp" | "forgotReset" | "resetSuccess"
  const [step, setStep] = useState("credentials");

  const [searchParams, setSearchParams] = useSearchParams();

  const [credentials, setCredentials] = useState({ userName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset flow state
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState(null);
  const [sending, setSending] = useState(false);
  const [otpDigits, setOtpDigits] = useState(emptyOtp);
  const [otpError, setOtpError] = useState(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const otpRefs = useRef([]);
  const otpBusyRef = useRef(false);

  const navigate = useNavigate();
  const { login } = useContext(PartnerAuthContext);

  // Invitation deep link: /partner/manager/login?reset=1&email=...
  // Jump straight into the password-setup flow with the email prefilled.
  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      setResetEmail(searchParams.get("email") || "");
      setStep("forgotEmail");
      // Clean the URL so a refresh doesn't re-trigger the jump.
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Sign in
  // ------------------------------------------------------------------

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
        role: "MANAGER",
      };
      const loginResponse = await loginManager(loginData);
      const resp = loginResponse?.data || {};
      const data = resp.data;

      if (resp.success && data?.token) {
        const profile = data.managerProfile || data.partnerUserProfile || null;
        await login(data.token, profile, "manager");
        navigate("/partner/manager/dashboard");
        return;
      }
      setError(resp.message || "Invalid username or password");
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

  // ------------------------------------------------------------------
  // Password setup / reset (shared endpoints with the partner flow —
  // the backend accepts partner AND manager accounts)
  // ------------------------------------------------------------------

  const handleSendCode = async (event) => {
    event?.preventDefault();
    const email = resetEmail.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setResetEmailError("Enter a valid email address");
      return;
    }
    if (sending) return;
    setSending(true);
    setResetEmailError(null);
    try {
      await sendForgotPasswordOtp(email);
      setOtpDigits(emptyOtp());
      setOtpError(null);
      setStep("forgotOtp");
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      setResetEmailError(getApiMessage(err, "Couldn't send the code. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const submitOtp = async (code) => {
    if (otpBusyRef.current) return;
    otpBusyRef.current = true;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      const response = await verifyForgotPasswordOtp(resetEmail.trim(), code);
      const resp = response?.data || {};
      if (resp.success && resp.data?.resetToken) {
        setResetToken(resp.data.resetToken);
        setNewPassword("");
        setConfirmPassword("");
        setResetErrors({});
        setStep("forgotReset");
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

  const handleOtpChange = (index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError(null);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) submitOtp(next.join(""));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...otpDigits];
      if (otpDigits[index]) {
        next[index] = "";
        setOtpDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setOtpDigits(next);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || "");
    setOtpDigits(next);
    setOtpError(null);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (next.every((d) => d !== "")) submitOtp(next.join(""));
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const next = {};
    if (!PASSWORD_PATTERN.test(newPassword)) {
      next.newPassword =
        "8-20 characters, with an uppercase letter, lowercase letter, number, and special character (@#$%^&+=!)";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setResetErrors(next);
    if (Object.keys(next).length > 0) return;

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
      setResetErrors({ form: resp.message || "Couldn't set your password. Please try again." });
    } catch (err) {
      setResetErrors({
        form: getApiMessage(err, "Couldn't set your password. Please try again."),
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    setCredentials({ userName: resetEmail, password: "" });
    setResetEmail("");
    setError(null);
    setStep("credentials");
  };

  const handleBackToSignIn = () => {
    setStep("credentials");
    setResetEmailError(null);
    setOtpDigits(emptyOtp());
    setOtpError(null);
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark} aria-hidden="true">
            <UserCog size={22} />
          </div>
        </div>

        <div className={styles.card} key={step}>
          {step === "credentials" && (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.heading}>Manager sign in</h1>
                <p className={styles.subheading}>Sign in to manage your assigned property</p>
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

                <div className={styles.optionsRow}>
                  <span />
                  <button
                    type="button"
                    className={styles.inlineLink}
                    onClick={() => {
                      setError(null);
                      setResetEmail(
                        EMAIL_PATTERN.test(credentials.userName.trim())
                          ? credentials.userName.trim()
                          : "",
                      );
                      setResetEmailError(null);
                      setStep("forgotEmail");
                    }}
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
                    "Sign in as Manager"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "forgotEmail" && (
            <>
              <button type="button" className={styles.backButton} onClick={handleBackToSignIn}>
                <ArrowLeft size={14} strokeWidth={2.5} />
                Back to sign in
              </button>

              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step 1 of 3</p>
                <h1 className={styles.heading}>Set your password</h1>
                <p className={styles.subheading}>
                  Confirm your account email and we&apos;ll send you a 6-digit code
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSendCode} noValidate>
                <div className={styles.field}>
                  <label htmlFor="resetEmail" className={styles.label}>
                    Email address
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetEmailError(null);
                    }}
                    className={`${styles.input} ${resetEmailError ? styles.inputInvalid : ""}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={sending}
                    aria-invalid={Boolean(resetEmailError)}
                    autoFocus
                  />
                  {resetEmailError && <p className={styles.fieldError}>{resetEmailError}</p>}
                </div>

                <button type="submit" className={styles.button} disabled={sending}>
                  {sending ? (
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
                onClick={() => setStep("forgotEmail")}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Back
              </button>

              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step 2 of 3</p>
                <h1 className={styles.heading}>Enter your code</h1>
                <p className={styles.subheading}>
                  We sent a 6-digit code to <strong>{resetEmail}</strong>
                </p>
              </div>

              <div className={styles.otpBlock}>
                <div className={styles.otpInputs} onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className={`${styles.otpBox} ${otpError ? styles.otpBoxError : ""}`}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={otpVerifying}
                      aria-label={`Digit ${i + 1} of verification code`}
                    />
                  ))}
                </div>
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
                      onClick={handleSendCode}
                      disabled={sending}
                    >
                      {sending ? "Sending…" : "Resend"}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {step === "forgotReset" && (
            <>
              <div className={styles.formHeader}>
                <p className={styles.stepText}>Step 3 of 3</p>
                <h1 className={styles.heading}>Choose a new password</h1>
                <p className={styles.subheading}>
                  Set the password you&apos;ll use to sign in as <strong>{resetEmail}</strong>
                </p>
              </div>

              <form className={styles.form} onSubmit={handleResetPassword} noValidate>
                <div className={styles.field}>
                  <label htmlFor="newPassword" className={styles.label}>
                    New password
                  </label>
                  <div className={styles.inputBox}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, newPassword: null, form: null }));
                      }}
                      className={`${styles.input} ${styles.passwordInput} ${
                        resetErrors.newPassword ? styles.inputInvalid : ""
                      }`}
                      placeholder="8-20 chars · upper, lower, digit, special"
                      autoComplete="new-password"
                      disabled={resetSubmitting}
                      aria-invalid={Boolean(resetErrors.newPassword)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowNewPassword((s) => !s)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetErrors.newPassword && (
                    <p className={styles.fieldError}>{resetErrors.newPassword}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setResetErrors((prev) => ({ ...prev, confirmPassword: null, form: null }));
                    }}
                    className={`${styles.input} ${
                      resetErrors.confirmPassword ? styles.inputInvalid : ""
                    }`}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    disabled={resetSubmitting}
                    aria-invalid={Boolean(resetErrors.confirmPassword)}
                  />
                  {resetErrors.confirmPassword && (
                    <p className={styles.fieldError}>{resetErrors.confirmPassword}</p>
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
                      Saving…
                    </>
                  ) : (
                    "Set password"
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
                <h1 className={styles.heading}>Password set</h1>
                <p className={styles.subheading}>
                  Your password is ready. Sign in to manage your property.
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
            Are you a partner?{" "}
            <Link to="/partner/login" className={styles.footerLink}>
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
