package com.appointments.booking.appointments.payload.response.user;

import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PropertyWithServicesResponse {

    private Long propertyId;
    private String propertyName;
    private String buildingNo;
    private String street;
    private String city;
    private String state;
    private String country;
    private List<ServicesResponse> servicesResponses;

}
