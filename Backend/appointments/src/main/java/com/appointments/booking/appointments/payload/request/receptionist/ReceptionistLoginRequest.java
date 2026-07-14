package com.appointments.booking.appointments.payload.request.receptionist;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login payload submitted from the dedicated Receptionist Login page at
 * /partner/receptionist/login. Receptionists authenticate with their email
 * (or phone number) and password — they are AppUsers with the RECEPTIONIST
 * role linked to a single Property via the partner's receptionist
 * assignment. Receptionists are read-only: they can only view that
 * property's appointments.
 */
@Data
public class ReceptionistLoginRequest {

    @NotBlank(message = "Email or phone number is required")
    private String userName;

    @NotBlank(message = "Password is required")
    private String password;
}
