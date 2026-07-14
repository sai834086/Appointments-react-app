package com.appointments.booking.appointments.payload.response.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServicesResponse {



    private Long serviceId;

    private String serviceName;

    private short eachServiceTimeInMinus;

    private Double serviceFee;

    private String description;

}
