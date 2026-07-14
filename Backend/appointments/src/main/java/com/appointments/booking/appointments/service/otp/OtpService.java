package com.appointments.booking.appointments.service.otp;

import com.appointments.booking.appointments.exception.InvalidException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Pre-registration email ownership check for the partner signup wizard.
 * <p>
 * This is intentionally separate from the existing link-based
 * "verify your email" flow in {@code MailService}/{@code AppUser} (which
 * runs AFTER an account is created). This one runs BEFORE the account
 * exists — the signup form's step 1 sends a 6-digit code to the address the
 * user typed, and won't let them continue to step 2 until they enter it
 * back correctly. When {@code saveUser} sees the email was OTP-verified, it
 * skips issuing a link/sending the follow-up email entirely (see
 * PartnerUserServiceImpl) so the user isn't asked to verify twice.
 * <p>
 * Backed by a simple in-memory map — this app runs as a single instance, so
 * there's no need for a DB table (and the codes are short-lived/single-use
 * anyway). If the app ever moves to multiple instances, this would need to
 * move to a shared store (Redis, DB) instead.
 */
@Service
public class OtpService {

    private static final int OTP_TTL_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 30;
    private static final int MAX_ATTEMPTS = 5;

    private static class OtpRecord {
        String code;
        LocalDateTime expiresAt;
        LocalDateTime lastSentAt;
        int attempts;
        boolean verified;
    }

    private final ConcurrentMap<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    /**
     * Generates and stores a fresh 6-digit code for the email, replacing any
     * previous one. Returns the code so the caller can email it. Throws if
     * called again too soon after the last send (resend cooldown).
     */
    public String issueOtp(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        issueOtpWithCode(email, code);
        return code;
    }

    /**
     * Stores an explicit code instead of generating a new one, so the same
     * 6-digit code can be delivered over multiple channels at once (e.g. the
     * login flow emails and texts the identical code so either can be used
     * to complete sign-in). Same resend-cooldown and expiry semantics as
     * {@link #issueOtp}.
     */
    public void issueOtpWithCode(String email, String code) {
        String key = normalize(email);
        OtpRecord existing = otpStore.get(key);
        if (existing != null && existing.lastSentAt != null
                && existing.lastSentAt.plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            throw new InvalidException("Please wait a moment before requesting another code.");
        }

        OtpRecord record = new OtpRecord();
        record.code = code;
        record.expiresAt = LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES);
        record.lastSentAt = LocalDateTime.now();
        record.attempts = 0;
        record.verified = false;
        otpStore.put(key, record);
    }

    /** Validates the code; marks the email verified on success. */
    public void verifyOtp(String email, String code) {
        String key = normalize(email);
        OtpRecord record = otpStore.get(key);
        if (record == null) {
            throw new InvalidException("Please request a new verification code.");
        }
        if (record.expiresAt.isBefore(LocalDateTime.now())) {
            otpStore.remove(key);
            throw new InvalidException("This code has expired. Please request a new one.");
        }
        if (record.attempts >= MAX_ATTEMPTS) {
            otpStore.remove(key);
            throw new InvalidException("Too many incorrect attempts. Please request a new code.");
        }
        record.attempts++;
        if (!record.code.equals(code)) {
            throw new InvalidException("That code isn't right. Please check and try again.");
        }
        record.verified = true;
    }

    /** True if this email has a currently-verified (not-yet-consumed) code. */
    public boolean isVerified(String email) {
        OtpRecord record = otpStore.get(normalize(email));
        return record != null && record.verified;
    }

    /** Clears the record once it's been used to complete registration, so it can't be replayed for a second signup. */
    public void consume(String email) {
        otpStore.remove(normalize(email));
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
