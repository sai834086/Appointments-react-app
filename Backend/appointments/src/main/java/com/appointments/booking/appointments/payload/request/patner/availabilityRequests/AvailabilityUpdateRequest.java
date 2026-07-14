package com.appointments.booking.appointments.payload.request.patner.availabilityRequests;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilityUpdateRequest {

    @NotNull(message = "Day is required, Only day like MONDAY")
    private DayEnum day;

    @NotNull(message = "Availability is required")
    private AvailabileEnum isAvailable;

    @NotNull(message = "opening hour is required in time")
    private LocalTime openTime;

    @NotNull(message = "closing hour is required in time")
    private LocalTime closeTime;

}
