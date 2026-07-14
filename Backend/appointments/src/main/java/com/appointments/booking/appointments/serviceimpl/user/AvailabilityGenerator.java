package com.appointments.booking.appointments.serviceimpl.user;

import com.appointments.booking.appointments.model.appointment.Appointments;
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.model.patner.OffTime;
import com.appointments.booking.appointments.payload.projection.AppointmentsInterval;
import com.appointments.booking.appointments.repository.appointments.AppointmentRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AvailabilityGenerator {

    private final AppointmentRepository appointmentRepository;

    public AvailabilityGenerator(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public List<LocalTime> generateTimeSlots(Availability availability, LocalDate date, short serviceTime){


        List<Appointments> appointments = appointmentRepository.findByAppointmentDate(date);

        List<AppointmentsInterval> existingAppointments = appointments.stream()
                .map(app -> new AppointmentsInterval(app.getStartTime(), app.getEndTime()))
                .collect(Collectors.toList());

        LocalTime now = LocalTime.now();
        boolean isToday = date.isEqual(LocalDate.now());

        List<LocalTime> availabileSlots = new ArrayList<>();
        LocalTime openTime = availability.getOpenTime();
        LocalTime closeTime = availability.getCloseTime();

        while(openTime.plusMinutes(serviceTime).isBefore(closeTime) ||
                openTime.plusMinutes(serviceTime).equals(closeTime)){
            LocalTime potentialEnd = openTime.plusMinutes(serviceTime);

            if (isToday && openTime.isBefore(now)) {
                openTime = openTime.plusMinutes(serviceTime); // IMPORTANT: Increment before skipping to avoid infinite loop
                continue;
            }
            if (isDuringAnyBreak(openTime, potentialEnd, availability.getOffTime())) {
                openTime = openTime.plusMinutes(serviceTime);
                continue;
            }
            if(!isOverlapping(openTime,potentialEnd, existingAppointments)){
                availabileSlots.add(openTime);
            }
            openTime = openTime.plusMinutes(serviceTime);
        }
        return availabileSlots;
    }

    private boolean isOverlapping(LocalTime start, LocalTime potentialEnd, List<AppointmentsInterval> existingAppointments) {

        for(AppointmentsInterval appointmentsInterval : existingAppointments){
            if(start.isBefore(appointmentsInterval.getEndTime()) && potentialEnd.isAfter(appointmentsInterval.getStartTIme())){
                return true;
            }
        }
        return false;
    }

    private boolean isDuringAnyBreak(LocalTime slotStart, LocalTime slotEnd, List<OffTime> breaks) {
        if (breaks == null || breaks.isEmpty()) {
            return false;
        }

        for (OffTime offTime : breaks) {
            if (slotStart.isBefore(offTime.getOffTimeTo()) &&
                    slotEnd.isAfter(offTime.getOffTimeFrom())) {
                return true;
            }
        }
        return false;
    }

}
