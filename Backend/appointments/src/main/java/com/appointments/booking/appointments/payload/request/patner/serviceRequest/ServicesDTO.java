package com.appointments.booking.appointments.payload.request.patner.serviceRequest;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ServicesDTO {

    @NotBlank(message = "service name required")
    private String serviceName;

    @NotBlank(message = "service time required")
    private short eachServiceTimeInMinus;

    private Double serviceFee;

    private String description;
}
