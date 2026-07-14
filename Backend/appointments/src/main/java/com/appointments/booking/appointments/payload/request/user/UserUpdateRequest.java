package com.appointments.booking.appointments.payload.request.user;

import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.validation.UniqueEmail;
import com.appointments.booking.appointments.validation.UniquePhoneNumber;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "first name required")
    private String firstName;

    @NotBlank(message = "last name required")
    private String lastName;

    @UniquePhoneNumber(message = "Phone Number already exists")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain only digits")
    private String phoneNumber;

    @Email
    @UniqueEmail(message = "Email already exists")
    private String email;

    @NotBlank(message = "address name required")
    private String address;

}
