package com.appointments.booking.appointments.payload.request.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginRequest {

    @NotBlank(message = "Email or Phone Number Required")
    private String userName;

    @NotBlank(message = "Password Required")
    private String password;
}
