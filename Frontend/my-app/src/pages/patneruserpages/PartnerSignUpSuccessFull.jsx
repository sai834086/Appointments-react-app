import { useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./PartnerSignUp.module.css";
import successStyles from "./PartnerSignUpSuccessFull.module.css";
import { resendVerificationEmail } from "../../api/authService";

const RESEND_COOLDOWN_SECONDS = 30;

export default function PartnerSignUpSuccessFull() {
  const location = useLocation();
  const email = location.state?.email || "";
  // Signups that verified their email via the OTP step already proved
  // ownership before the account was even created — no follow-up link
  // needed, so this screen shouldn't ask them to "check their email" again.
  const emailPreVerified = Boolean(location.state?.emailPreVerified);

  const [resendState, setResendState] = useState("idle"); // idle | sending | sent | error
  const [cooldown, setCooldown] = useState(0);

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResendState("sending");
    try {
      await resendVerificationEmail(email);
      setResendState("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setResendState("error");
    }
  }

  return (
    <div className={styles.page}>
    <div className={styles.mainContainer}>
      <div className={successStyles.container}>
        <div className={successStyles.iconCircle} aria-hidden="true">
          <span className={successStyles.iconGlyph}>{emailPreVerified ? "✅" : "✉️"}</span>
        </div>

        <h2 className={successStyles.heading}>
          {emailPreVerified ? "You're all set" : "Check your email"}
        </h2>

        {emailPreVerified ? (
          <p className={successStyles.body}>
            {email ? (
              <>
                <strong className={successStyles.email}>{email}</strong> is
                verified and your partner account has been created.
              </>
            ) : (
              "Your email is verified and your partner account has been created."
            )}
          </p>
        ) : (
          <p className={successStyles.body}>
            {email ? (
              <>
                We've sent a verification link to{" "}
                <strong className={successStyles.email}>{email}</strong>.
                Click the link to activate your account and finish signing up.
              </>
            ) : (
              "We've sent a verification link to your email address. Click the link to activate your account and finish signing up."
            )}
          </p>
        )}

        <p className={successStyles.subtext}>
          {emailPreVerified
            ? "Our team will now review your business details — you'll be notified by email and phone once you're approved to sign in."
            : "Once your email is verified, our team will also review your business details — you'll be notified by email and phone when you're fully approved to sign in."}
        </p>

        {emailPreVerified ? (
          <div className={successStyles.actions}>
            <a href="/partner/login" className={successStyles.loginLink}>
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className={successStyles.actions}>
              <button
                type="button"
                className={successStyles.resendButton}
                onClick={handleResend}
                disabled={!email || resendState === "sending" || cooldown > 0}
              >
                {resendState === "sending"
                  ? "Sending…"
                  : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : "Resend verification email"}
              </button>
              <a href="/partner/login" className={successStyles.loginLink}>
                Back to sign in
              </a>
            </div>

            {resendState === "sent" && cooldown === RESEND_COOLDOWN_SECONDS && (
              <p className={successStyles.resendNote} role="status">
                Sent! Check your inbox (and spam folder) for the new link.
              </p>
            )}
            {resendState === "error" && (
              <p className={successStyles.resendError} role="alert">
                Couldn't resend the email right now. Please try again in a moment.
              </p>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
