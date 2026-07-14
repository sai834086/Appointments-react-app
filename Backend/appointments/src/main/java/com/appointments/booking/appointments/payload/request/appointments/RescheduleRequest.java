package com.appointments.booking.appointments.payload.request.appointments;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class RescheduleRequest {

    @NotNull(message = "Appointment Id required")
    private Long appointmentId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Start Time is required")
    private LocalTime startTime;
}
