package com.appointments.booking.appointments.payload.request.support;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportLoginRequest {

    @NotBlank(message = "Email is required")
    private String userName;

    @NotBlank(message = "Password is required")
    private String password;
}
