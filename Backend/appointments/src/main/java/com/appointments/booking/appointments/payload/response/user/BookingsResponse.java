package com.appointments.booking.appointments.payload.response.user;

import com.appointments.booking.appointments.model.enums.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class BookingsResponse {

    private Long appointmentId;

    private Long serviceId;

    private Long employeeId;

    private LocalDateTime bookedAt;

    private LocalDateTime updatedAt;

    private String confirmationNumber;

    private LocalDate appointmentDate;

    private LocalTime startTime;

    private short serviceTimeInMinus;

    private String serviceName;

    private String propertyName;

    private String propertyAddress;

    private String employeeName;

    private AppointmentStatus status;
}
