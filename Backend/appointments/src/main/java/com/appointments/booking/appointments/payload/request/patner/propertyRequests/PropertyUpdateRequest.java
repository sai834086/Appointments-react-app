package com.appointments.booking.appointments.payload.request.patner.propertyRequests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PropertyUpdateRequest {
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "First name must contain only letters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "Last name must contain only letters")
    private String lastName;

    @NotBlank(message = "Property Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 45)
    private String email;

    @NotBlank(message = "Property Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    // ---------------- Property Info ----------------

    @NotBlank(message = "Business name is required")
    @Pattern(regexp = "^[A-Za-z' ]{1,44}$", message = "Business name must contain only letters")
    private String propertyName;

    // ---------------- Address ----------------
    @NotBlank(message = "Building number is required")
    @Pattern(regexp = "^[A-Za-z0-9-_()/]{1,45}$", message = "Building number can contain letters and digits")
    private String buildingNo;

    @NotBlank(message = "Street is required")
    @Pattern(regexp = "^[A-Za-z0-9' ]{1,45}$", message = "Street can contain letters, digits, and spaces")
    private String street;

    @NotBlank(message = "City is required")
    @Pattern(regexp = "^[A-Za-z' ]{1,44}$", message = "City must contain only letters")
    private String city;

    @NotBlank(message = "State is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "State must contain only letters")
    private String state;

    @NotBlank(message = "Country is required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "Country must contain only letters")
    private String country;

    @NotBlank(message = "Zip code is required")
    @Pattern(regexp = "^[A-Za-z0-9]{1,45}$", message = "Zip code can contain letters and digits")
    private String zipCode;

}
