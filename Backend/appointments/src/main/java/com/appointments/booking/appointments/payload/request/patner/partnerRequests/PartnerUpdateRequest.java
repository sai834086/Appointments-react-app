package com.appointments.booking.appointments.payload.request.patner.partnerRequests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PartnerUpdateRequest {

    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "First name must contain only letters")
    private String firstName;

    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "Last name must contain only letters")
    private String lastName;

    @Email(message = "Email should be valid")
    @Size(max = 45)
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;
}