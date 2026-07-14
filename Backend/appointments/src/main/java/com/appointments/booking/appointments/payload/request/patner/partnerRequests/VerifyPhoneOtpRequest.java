package com.appointments.booking.appointments.payload.request.patner.partnerRequests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyPhoneOtpRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Enter the 6-digit code")
    private String otp;
}
