package com.appointments.booking.appointments.payload.response.patner.offTimeResponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetAllOffTimeResponse {

    private Long offTimeId;

    private LocalTime offTimeFrom;

    private LocalTime offTimeTo;
}
