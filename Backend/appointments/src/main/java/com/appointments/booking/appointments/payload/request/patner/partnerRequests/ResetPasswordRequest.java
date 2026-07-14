package com.appointments.booking.appointments.payload.request.patner.partnerRequests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Final step of forgot-password — the reset token minted right after OTP
 * verification (see PasswordResetService), plus the new password. Same
 * password strength rule as signup (PartnerUserSignUpRequest).
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Reset session is missing or expired")
    private String resetToken;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 20, message = "Password must be 8-20 characters")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!]).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String newPassword;

    @NotBlank(message = "Please confirm your password")
    private String confirmPassword;
}
