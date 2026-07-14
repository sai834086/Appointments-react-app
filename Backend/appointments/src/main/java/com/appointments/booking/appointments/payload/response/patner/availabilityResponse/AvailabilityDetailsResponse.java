package com.appointments.booking.appointments.payload.response.patner.availabilityResponse;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilityDetailsResponse {

    private Long availabilityId;

    private DayEnum day;

    private AvailabileEnum isAvailable;

    private LocalTime openTime;

    private LocalTime closeTime;

}
