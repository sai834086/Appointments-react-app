package com.appointments.booking.appointments.payload.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class UserSignUpRequest {

    @NotBlank(message = "First name required")
    @Pattern(regexp = "^[A-Za-z ]+$", message = "First name must contain only letters")
    private String firstName;

    @NotBlank(message = "Last name required")
    @Pattern(regexp = "^[A-Za-z ]+$", message = "Last name must contain only letters")
    private String lastName;

    @Email
    @NotBlank(message = "Email required")
    private String email;

    @NotBlank(message = "Phone number required")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain only digits")
    private String phoneNumber;

    private String address;

    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = ".*[A-Z].*", message = "Password must contain at least one uppercase letter")
    @Pattern(regexp = ".*[a-z].*", message = "Password must contain at least one lowercase letter")
    @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
    @Pattern(regexp = ".*[@#$%^&+=!].*", message = "Password must contain at least one special symbol")
    @NotBlank(message = "Password required")
    private String password;

}