package com.appointments.booking.appointments.payload.response.patner.availabilityResponse;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.appointments.booking.appointments.payload.response.patner.offTimeResponse.GetAllOffTimeResponse;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponseWithOffTime {

    private Long availabilityId;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private DayEnum day;

    private AvailabileEnum isAvailable;

    private LocalTime openTime;

    private LocalTime closeTime;

    private List<GetAllOffTimeResponse> offTimes;
}
