package com.appointments.booking.appointments.payload.response.user;

import com.appointments.booking.appointments.model.enums.VerificationEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllPartnerUsersToAppUsers {

    // 1. These fields MUST exist matching the "target" in your Mapper

    private Long partnerId;
    private String firstName;
    private String email;

    // 2. Add other fields you want in the list
    private String businessName;
    private String phoneNumber;
    private String status;

    private String buildingNo;

    private String street;

    private String city;

    private String state;

    private String country;

    private String zipCode;

    // 3. Counts for dashboard card display
    private long propertyCount;

    private long serviceCount;
}
