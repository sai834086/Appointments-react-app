package com.appointments.booking.appointments.payload.response.patner.partnerResponse;

import com.appointments.booking.appointments.model.enums.VerificationEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;

@Data
public class PartnerProfileResponse {

    private Long partnerId;

    private String firstName;

    private String lastName;

    private String email;

    private String countryCode;

    private String phoneNumber;

    private String businessType;

    private String businessName;

    @Enumerated(EnumType.STRING)
    private VerificationEnum isVerified;

    @Enumerated(EnumType.STRING)
    private StatusEnum status;

    private String buildingNo;

    private String street;

    private String city;

    private String state;

    private String country;

    private String zipCode;

}
