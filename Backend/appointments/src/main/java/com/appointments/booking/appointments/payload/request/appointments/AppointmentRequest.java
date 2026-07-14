package com.appointments.booking.appointments.payload.request.appointments;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Start Time is required")
    private LocalTime startTime;
}
