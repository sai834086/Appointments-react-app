package com.appointments.booking.appointments.service.mail;

import com.appointments.booking.appointments.exception.InvalidException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends the account signup verification email.
 * <p>
 * If no SMTP username is configured (local dev without real mail
 * credentials), this falls back to logging the verification link instead of
 * attempting to send — so signup still works end-to-end without requiring a
 * real mailbox. Configure MAIL_USERNAME/MAIL_PASSWORD (see
 * application.properties) to send real emails.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isSendingEnabled() {
        return smtpUsername != null && !smtpUsername.isBlank();
    }

    public String buildVerificationLink(String token) {
        return frontendBaseUrl + "/partner/verify-email?token=" + token;
    }

    public void sendPartnerVerificationEmail(String toEmail, String firstName, String token) {
        String link = buildVerificationLink(token);

        if (!isSendingEnabled()) {
            // Dev-friendly fallback: no SMTP configured, just log the link so
            // it can be copy-pasted into the browser during local testing.
            log.info("[MailService] SMTP not configured — verification link for {}: {}", toEmail, link);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Verify your email to finish setting up your partner account");
            helper.setText(buildPlainTextBody(firstName, link), buildHtmlBody(firstName, link));
            mailSender.send(message);
        } catch (MessagingException | RuntimeException e) {
            // Don't let a transient mail-provider hiccup fail the whole
            // registration transaction — the account still exists and the
            // user can request a new link via "Resend verification email".
            log.warn("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Sends the pre-registration OTP used to confirm email ownership during
     * step 1 of partner signup (see OtpService). Unlike the link-based
     * verification email above, a failure here is surfaced to the caller
     * (rather than silently logged) since the user is actively waiting on
     * this specific code to continue — there's nothing useful they can do
     * if we swallow the failure.
     */
    public void sendOtpEmail(String toEmail, String code) {
        if (!isSendingEnabled()) {
            log.info("[MailService] SMTP not configured — OTP code for {}: {}", toEmail, code);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Your verification code is " + code);
            helper.setText(buildOtpPlainTextBody(code), buildOtpHtmlBody(code));
            mailSender.send(message);
        } catch (MessagingException | RuntimeException e) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new InvalidException("Couldn't send the verification email. Please try again.");
        }
    }

    private String buildOtpPlainTextBody(String code) {
        return "Your verification code is: " + code + "\n\n"
                + "Enter this code to confirm your email address. It expires in 10 minutes.\n"
                + "If you didn't request this, you can ignore this email.\n";
    }

    private String buildOtpHtmlBody(String code) {
        return "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2937;\">"
                + "<h2 style=\"margin:0 0 16px;color:#18181b;\">Verify your email</h2>"
                + "<p style=\"margin:0 0 24px;line-height:1.6;\">Enter this code to confirm your email address:</p>"
                + "<p style=\"margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:10px;color:#4338ca;\">" + code + "</p>"
                + "<p style=\"margin:0;font-size:12px;color:#9ca3af;\">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>"
                + "</div>";
    }

    private String buildPlainTextBody(String firstName, String link) {
        return "Hi " + firstName + ",\n\n"
                + "Thanks for signing up as a partner. Please verify your email address by opening this link:\n\n"
                + link + "\n\n"
                + "This link expires in 24 hours. If you didn't create this account, you can ignore this email.\n";
    }

    private String buildHtmlBody(String firstName, String link) {
        return "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2937;\">"
                + "<h2 style=\"margin:0 0 16px;color:#1e293b;\">Verify your email</h2>"
                + "<p style=\"margin:0 0 20px;line-height:1.6;\">Hi " + escape(firstName) + ",</p>"
                + "<p style=\"margin:0 0 24px;line-height:1.6;\">Thanks for signing up as a partner. Please confirm this is your email address to activate your account.</p>"
                + "<p style=\"margin:0 0 28px;\"><a href=\"" + link + "\" style=\"display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;\">Verify Email Address</a></p>"
                + "<p style=\"margin:0 0 8px;font-size:13px;color:#6b7280;\">Or paste this link into your browser:</p>"
                + "<p style=\"margin:0 0 24px;font-size:13px;word-break:break-all;\"><a href=\"" + link + "\" style=\"color:#3b82f6;\">" + link + "</a></p>"
                + "<p style=\"margin:0;font-size:12px;color:#9ca3af;\">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>"
                + "</div>";
    }

    // ------------------------------------------------------------------
    // Manager invitation
    // ------------------------------------------------------------------

    public String buildManagerPasswordSetupLink(String email) {
        String encoded = java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8);
        return frontendBaseUrl + "/partner/manager/login?reset=1&email=" + encoded;
    }

    /**
     * Invitation sent when a partner adds a manager. The manager's account
     * is created with a random password they never see — the email tells
     * them they've been added and links to the first-login password setup
     * (the manager login page's reset flow, pre-filled with their email).
     *
     * A failure here is logged, not thrown: the account already exists and
     * the manager can always use "Forgot password" on the login page.
     */
    public void sendManagerInviteEmail(String toEmail, String firstName,
                                       String businessName, String propertyName) {
        String link = buildManagerPasswordSetupLink(toEmail);

        if (!isSendingEnabled()) {
            // Dev/testing fallback: SMTP not configured, so print the link
            // prominently in the console instead of emailing it.
            log.info("\n"
                    + "==================== MANAGER INVITE (SMTP not configured) ====================\n"
                    + "  Manager : {} <{}>\n"
                    + "  Set-password link:\n"
                    + "  {}\n"
                    + "==============================================================================",
                    firstName, toEmail, link);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("You've been added as a manager" + (businessName != null && !businessName.isBlank() ? " at " + businessName : ""));
            helper.setText(
                    buildManagerInvitePlainTextBody(firstName, businessName, propertyName, link),
                    buildManagerInviteHtmlBody(firstName, businessName, propertyName, link));
            mailSender.send(message);
        } catch (MessagingException | RuntimeException e) {
            log.warn("Failed to send manager invite email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildManagerInvitePlainTextBody(String firstName, String businessName,
                                                   String propertyName, String link) {
        String where = (businessName != null && !businessName.isBlank() ? businessName : "a business")
                + (propertyName != null && !propertyName.isBlank() ? " (" + propertyName + ")" : "");
        return "Hi " + firstName + ",\n\n"
                + "You have been added as a manager at " + where + ".\n\n"
                + "An account has been created for you with this email address. For security, "
                + "your password was auto-generated — set your own password before signing in "
                + "for the first time by opening this link:\n\n"
                + link + "\n\n"
                + "If you weren't expecting this invitation, you can ignore this email.\n";
    }

    private String buildManagerInviteHtmlBody(String firstName, String businessName,
                                              String propertyName, String link) {
        String where = escape(businessName != null && !businessName.isBlank() ? businessName : "a business")
                + (propertyName != null && !propertyName.isBlank() ? " (" + escape(propertyName) + ")" : "");
        return "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2937;\">"
                + "<h2 style=\"margin:0 0 16px;color:#1e293b;\">You're now a manager</h2>"
                + "<p style=\"margin:0 0 20px;line-height:1.6;\">Hi " + escape(firstName) + ",</p>"
                + "<p style=\"margin:0 0 24px;line-height:1.6;\">You have been added as a manager at <strong>" + where + "</strong>. "
                + "An account was created for you with this email address. For security, your password was auto-generated — "
                + "set your own password before signing in for the first time.</p>"
                + "<p style=\"margin:0 0 28px;\"><a href=\"" + link + "\" style=\"display:inline-block;background:linear-gradient(135deg,#6366f1,#4338ca);color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;\">Set Your Password</a></p>"
                + "<p style=\"margin:0 0 8px;font-size:13px;color:#6b7280;\">Or paste this link into your browser:</p>"
                + "<p style=\"margin:0 0 24px;font-size:13px;word-break:break-all;\"><a href=\"" + link + "\" style=\"color:#4f46e5;\">" + link + "</a></p>"
                + "<p style=\"margin:0;font-size:12px;color:#9ca3af;\">If you weren't expecting this invitation, you can safely ignore this email.</p>"
                + "</div>";
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
