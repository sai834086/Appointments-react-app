package com.appointments.booking.appointments.payload.response.user;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppUserProfileResponse {

    private Long appUserId;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private String address;
}
