package com.appointments.booking.appointments.payload.response.patner.serviceResponse;

import com.appointments.booking.appointments.model.enums.StatusEnum;
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

    private long employeeCount;

    /** ACTIVE when at least one employee offers this service. */
    private StatusEnum status;

}
