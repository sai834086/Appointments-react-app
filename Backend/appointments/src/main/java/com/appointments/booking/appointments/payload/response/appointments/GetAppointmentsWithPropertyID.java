package com.appointments.booking.appointments.payload.response.appointments;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface GetAppointmentsWithPropertyID {

    Long getAppointmentId();
    LocalDateTime getBookedAt();
    LocalDateTime getUpdatedAt();
    String getConfirmationNumber();
    LocalDate getAppointmentDate();
    LocalTime getStartTime();
    LocalTime getEndTime();

    // IMPORTANT: Keep this as a String to avoid Enum casting errors from Native SQL
    String getStatus();

    String getEmployeeName();
    String getPropertyName();
    String getServiceName();
    String getCustomerName();
}