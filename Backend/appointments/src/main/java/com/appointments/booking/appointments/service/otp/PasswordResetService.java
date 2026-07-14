package com.appointments.booking.appointments.service.otp;

import com.appointments.booking.appointments.exception.InvalidException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Bridges "OTP verified" to "set a new password" for the forgot-password
 * flow. Once {@code OtpService.verifyOtp} succeeds for an email, the
 * controller calls {@link #issueResetToken} to mint a short-lived, single-use
 * opaque token; the frontend holds onto that (not the OTP) while the user
 * types their new password, and the final reset-password call presents it
 * instead of the OTP. This means the reset-password step never has to see
 * the OTP again, and can't be reached without having verified it first.
 * <p>
 * In-memory only, same as {@link OtpService}/{@link PhoneOtpService} — this
 * app runs as a single instance, so no shared store is needed. Tokens expire
 * after 10 minutes and are removed the moment they're used.
 */
@Service
public class PasswordResetService {

    private static final int TOKEN_TTL_MINUTES = 10;

    private static class ResetRecord {
        String email;
        LocalDateTime expiresAt;
    }

    private final ConcurrentMap<String, ResetRecord> tokenStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    /** Issues a fresh single-use token proving this email's OTP was just verified. */
    public String issueResetToken(String email) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        ResetRecord record = new ResetRecord();
        record.email = normalize(email);
        record.expiresAt = LocalDateTime.now().plusMinutes(TOKEN_TTL_MINUTES);
        tokenStore.put(token, record);
        return token;
    }

    /** Resolves the email a token was issued for, or throws if invalid/expired. */
    public String resolveEmail(String token) {
        ResetRecord record = tokenStore.get(normalizeToken(token));
        if (record == null) {
            throw new InvalidException("This reset session has expired. Please start over.");
        }
        if (record.expiresAt.isBefore(LocalDateTime.now())) {
            tokenStore.remove(normalizeToken(token));
            throw new InvalidException("This reset session has expired. Please start over.");
        }
        return record.email;
    }

    /** Clears the token once the password has been changed, so it can't be reused. */
    public void consume(String token) {
        tokenStore.remove(normalizeToken(token));
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeToken(String token) {
        return token == null ? "" : token.trim();
    }
}
