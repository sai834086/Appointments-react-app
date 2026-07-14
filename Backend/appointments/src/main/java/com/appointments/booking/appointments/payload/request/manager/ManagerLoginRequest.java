package com.appointments.booking.appointments.payload.request.manager;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login payload submitted from the dedicated Manager Login page at
 * /partner/manager/login. Managers authenticate with their email (or phone
 * number) and password — they are AppUsers with the MANAGER role linked to a
 * single Property via the partner's manager assignment.
 */
@Data
public class ManagerLoginRequest {

    @NotBlank(message = "Email or phone number is required")
    private String userName;

    @NotBlank(message = "Password is required")
    private String password;
}
