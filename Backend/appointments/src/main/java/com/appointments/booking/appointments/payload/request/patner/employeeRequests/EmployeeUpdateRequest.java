package com.appointments.booking.appointments.payload.request.patner.employeeRequests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.jetbrains.annotations.NotNull;

@Data
public class EmployeeUpdateRequest {

    @NotNull
    private Long employeeId;

    @NotBlank(message = "first name required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "First name must contain only letters")
    private String firstName;

    @NotBlank(message = "last name required")
    @Pattern(regexp = "^[A-Za-z ]{1,44}$", message = "Last name must contain only letters")
    private String lastName;

    @Email(message = "Email should be valid")
    @Size(max = 45)
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @Pattern(regexp = "[0-9]{1}")
    private String appointmentsOpenTillInMonths;

}
