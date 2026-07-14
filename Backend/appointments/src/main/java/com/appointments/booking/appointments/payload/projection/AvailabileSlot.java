package com.appointments.booking.appointments.payload.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabileSlot {

    private LocalTime startTime;

    private LocalTime endTime;
}
