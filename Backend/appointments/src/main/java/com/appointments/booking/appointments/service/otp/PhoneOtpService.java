package com.appointments.booking.appointments.service.otp;

import com.appointments.booking.appointments.exception.InvalidException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Pre-registration phone ownership check for the partner signup wizard —
 * the phone-number equivalent of {@link OtpService} (which does the same
 * thing for email). Kept as a separate class rather than generalizing
 * OtpService to take an arbitrary identifier, so the already-working email
 * flow can't regress from a shared-code refactor.
 * <p>
 * Same shape as OtpService: in-memory map, 10-minute TTL, 30-second resend
 * cooldown, 5 max attempts. Single-instance only — see OtpService's javadoc
 * for the same caveat about needing a shared store (Redis/DB) if this app
 * ever runs on more than one instance.
 */
@Service
public class PhoneOtpService {

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
     * Generates and stores a fresh 6-digit code for the phone number,
     * replacing any previous one. Returns the code so the caller can text
     * it. Throws if called again too soon after the last send (resend
     * cooldown).
     */
    public String issueOtp(String phoneNumber) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        issueOtpWithCode(phoneNumber, code);
        return code;
    }

    /**
     * Stores an explicit code instead of generating a new one, so the same
     * 6-digit code can be delivered over multiple channels at once (e.g. the
     * login flow emails and texts the identical code so either can be used
     * to complete sign-in). Same resend-cooldown and expiry semantics as
     * {@link #issueOtp}.
     */
    public void issueOtpWithCode(String phoneNumber, String code) {
        String key = normalize(phoneNumber);
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

    /** Validates the code; marks the phone number verified on success. */
    public void verifyOtp(String phoneNumber, String code) {
        String key = normalize(phoneNumber);
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

    /** True if this phone number has a currently-verified (not-yet-consumed) code. */
    public boolean isVerified(String phoneNumber) {
        OtpRecord record = otpStore.get(normalize(phoneNumber));
        return record != null && record.verified;
    }

    /** Clears the record once it's been used to complete registration, so it can't be replayed for a second signup. */
    public void consume(String phoneNumber) {
        otpStore.remove(normalize(phoneNumber));
    }

    private String normalize(String phoneNumber) {
        return phoneNumber == null ? "" : phoneNumber.trim();
    }
}
