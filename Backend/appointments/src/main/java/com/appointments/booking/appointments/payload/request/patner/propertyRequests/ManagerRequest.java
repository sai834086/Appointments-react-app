package com.appointments.booking.appointments.payload.request.patner.propertyRequests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request payload used by the partner when creating or updating a
 * property's manager.
 *
 * - On ADD: firstName, lastName, email, phoneNumber and password are required
 *           (password is required only if the manager is a brand-new AppUser;
 *           existing users are reused).
 * - On UPDATE: password is optional; pass an empty string to keep current.
 */
@Data
public class ManagerRequest {

    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "First name must contain only letters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "Last name must contain only letters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 45)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    // Password optional — empty string is allowed (used on update, or when
    // linking an existing AppUser who already has a password).
    @Pattern(
            regexp = "^$|^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!]).{8,20}$",
            message = "Password must be 8-20 characters and contain upper, lower, digit, and special char"
    )
    private String password;
}
