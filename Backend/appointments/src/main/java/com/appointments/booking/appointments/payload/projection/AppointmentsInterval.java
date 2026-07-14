package com.appointments.booking.appointments.payload.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@AllArgsConstructor
@Data
@NoArgsConstructor
public class AppointmentsInterval {

    private LocalTime startTIme;

    private LocalTime endTime;
}
