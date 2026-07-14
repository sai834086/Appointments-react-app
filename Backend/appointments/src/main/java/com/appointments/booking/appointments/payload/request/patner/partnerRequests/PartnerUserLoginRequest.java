package com.appointments.booking.appointments.payload.request.patner.partnerRequests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerUserLoginRequest {

    @NotBlank(message = "Email or Phone Number Required")
    private String userName;

    @NotBlank(message = "Password Required")
    private String password;

    @NotBlank(message = "Role Required")
    private String role;
}
