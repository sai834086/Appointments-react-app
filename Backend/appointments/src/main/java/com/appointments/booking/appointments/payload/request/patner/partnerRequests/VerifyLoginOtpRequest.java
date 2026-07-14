package com.appointments.booking.appointments.payload.request.patner.partnerRequests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Second step of password+OTP login — the code the partner just received by
 * email and SMS. {@code userName} mirrors whatever they typed into the
 * login form (email or phone number), so — unlike {@link VerifyOtpRequest},
 * which is email-only for the signup flow — this has no {@code @Email}
 * constraint.
 */
@Data
public class VerifyLoginOtpRequest {

    @NotBlank(message = "Email or phone number is required")
    private String userName;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Enter the 6-digit code")
    private String otp;
}
