package com.appointments.booking.appointments.service.appointment;

import com.appointments.booking.appointments.payload.request.appointments.AppointmentRequest;
import com.appointments.booking.appointments.payload.request.appointments.RescheduleRequest;
import com.appointments.booking.appointments.payload.response.appointments.GetAppointmentsWithPropertyID;

import java.time.LocalDate;
import java.util.List;


public interface AppointmentService {

     String bookAppointment(AppointmentRequest request, Long appUserId);

     void rescheduleAppointment(RescheduleRequest rescheduleRequest, Long id);

     List<GetAppointmentsWithPropertyID> getAppointments(Long propertyId, LocalDate date, Long userId);
}
