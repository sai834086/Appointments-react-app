package com.appointments.booking.appointments.payload.request.patner.offTimeRequest;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalTime;

@Data
public class OffTimeRegisterRequest {


    @NotBlank(message = "from in time format required")
    private LocalTime offTimeFrom;

    @NotBlank(message = "to in time format required")
    private LocalTime offTimeTo;
}
