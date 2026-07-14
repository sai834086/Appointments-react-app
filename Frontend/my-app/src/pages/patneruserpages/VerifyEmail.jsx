import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./PartnerSignUp.module.css";
import verifyStyles from "./VerifyEmail.module.css";
import { verifyEmail, resendVerificationEmail } from "../../api/authService";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Resend form state — shown when the link is invalid/expired, since we
  // don't necessarily know the account's email from a bad/expired token.
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("This verification link is missing its token.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        setVerifiedEmail(res?.data?.data?.email || "");
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(
          err?.response?.data?.message ||
            "This verification link is invalid or has expired.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail) return;
    setResendState("sending");
    try {
      await resendVerificationEmail(resendEmail);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  return (
    <div className={styles.page}>
    <div className={styles.mainContainer}>
      <div className={verifyStyles.container}>
        {status === "verifying" && (
          <>
            <span className={verifyStyles.spinner} aria-hidden="true" />
            <h2 className={verifyStyles.heading}>Verifying your email…</h2>
            <p className={verifyStyles.body}>This will just take a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={verifyStyles.iconCircleSuccess} aria-hidden="true">
              <span className={verifyStyles.iconGlyph}>✓</span>
            </div>
            <h2 className={verifyStyles.heading}>Email verified</h2>
            <p className={verifyStyles.body}>
              {verifiedEmail ? (
                <>
                  <strong>{verifiedEmail}</strong> is now confirmed.
                </>
              ) : (
                "Your email address is now confirmed."
              )}{" "}
              Our team will review your business details next — you'll be
              notified by email and phone once you're approved to sign in.
            </p>
            <a href="/partner/login" className={verifyStyles.primaryLink}>
              Back to sign in
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className={verifyStyles.iconCircleError} aria-hidden="true">
              <span className={verifyStyles.iconGlyph}>!</span>
            </div>
            <h2 className={verifyStyles.heading}>Link didn't work</h2>
            <p className={verifyStyles.body}>{errorMessage}</p>

            {resendState === "sent" ? (
              <p className={verifyStyles.resendSent} role="status">
                If that email exists, a new verification link is on its way —
                check your inbox.
              </p>
            ) : (
              <form className={verifyStyles.resendForm} onSubmit={handleResend}>
                <label className={verifyStyles.resendLabel}>
                  Enter your email to get a new link
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className={verifyStyles.resendInput}
                    placeholder="you@business.com"
                  />
                </label>
                <button
                  type="submit"
                  className={verifyStyles.resendButton}
                  disabled={resendState === "sending"}
                >
                  {resendState === "sending" ? "Sending…" : "Send new link"}
                </button>
              </form>
            )}

            <a href="/partner/login" className={verifyStyles.secondaryLink}>
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
