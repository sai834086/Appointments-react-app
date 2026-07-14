package com.appointments.booking.appointments.payload.response.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllPropertiesToAppUsers {

    private Long propertyId;

    private String email;

    private String phoneNumber;

    private String propertyName;

    private String buildingNo;

    private String street;

    private String city;

    private String state;

    private String country;

    private String zipCode;
}
