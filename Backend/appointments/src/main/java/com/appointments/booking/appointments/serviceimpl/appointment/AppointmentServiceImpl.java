package com.appointments.booking.appointments.serviceimpl.appointment;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.exception.UnavailabileException;
import com.appointments.booking.appointments.model.appointment.Appointments;
import com.appointments.booking.appointments.model.enums.AppointmentStatus;
import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.request.appointments.AppointmentRequest;
import com.appointments.booking.appointments.payload.request.appointments.RescheduleRequest;
import com.appointments.booking.appointments.payload.response.appointments.GetAppointmentsWithPropertyID;
import com.appointments.booking.appointments.repository.appointments.AppointmentRepository;
import com.appointments.booking.appointments.repository.patner.AvailabilityRepository;
import com.appointments.booking.appointments.repository.patner.EmployeeRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.patner.ServicesRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.model.notification.NotificationType;
import com.appointments.booking.appointments.service.appointment.AppointmentService;
import com.appointments.booking.appointments.service.notification.NotificationService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@AllArgsConstructor
@Service
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ServicesRepository servicesRepository;
    private final AvailabilityRepository availabilityRepository;
    private final AppUserRepository appUserRepository;
    private final NotificationService notificationService;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional
    public String bookAppointment(AppointmentRequest request, Long appUserId) {

        // 1. Fetch Entities (Fail Fast)
        Employee employee = employeeRepository.findByIdWithLock(request.getEmployeeId())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Employee not found"));

        Services service = servicesRepository.findById(request.getServiceId())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Service not found"));

        AppUser appUser = appUserRepository.findById(appUserId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));


        // 2. Calculate Times
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(service.getEachServiceTimeInMinus());

        // 3. Validate Logic (Extracted Method)
        validateAppointment(request.getEmployeeId(), request.getDate(), startTime, endTime);

        // 4. Create & Save Appointment
        Appointments appointment = new Appointments();
        appointment.setEmployee(employee);
        appointment.setServices(service);
        appointment.setProperty(employee.getProperty());
        appointment.setAppointmentDate(request.getDate());
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus(AppointmentStatus.Booked);
        appointment.setCustomer(appUser);

        Appointments savedAppointment = appointmentRepository.save(appointment);

        // Create notification
        notificationService.createNotification(
                appUserId,
                "Booking Confirmed",
                "Your appointment for " + service.getServiceName() +
                        " at " + employee.getProperty().getPropertyName() +
                        " on " + request.getDate() + " at " + startTime +
                        " is confirmed.",
                NotificationType.BOOKING_CONFIRMED,
                savedAppointment.getConfirmationNumber()
        );

        return savedAppointment.getConfirmationNumber();
    }

    @Override
    public void rescheduleAppointment(RescheduleRequest rescheduleRequest, Long userId) {

        // 1. Fetch & Security Checks
        Appointments appointment = appointmentRepository.findById(rescheduleRequest.getAppointmentId())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Appointment not found"));

        if (!appointment.getCustomer().getUserId().equals(userId)) {
            throw new UnauthorizedAccessOrUnknownException("You are not authorized to reschedule this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.Cancelled ||
                appointment.getStatus() == AppointmentStatus.Completed) {
            throw new InvalidException("Cannot reschedule a completed or cancelled appointment.");
        }

        // 2. Validate Date/Time (Past Check)
        if (rescheduleRequest.getDate().isBefore(LocalDate.now())) {
            throw new UnavailabileException("Cannot reschedule to a past date");
        }
        if (rescheduleRequest.getDate().isEqual(LocalDate.now()) &&
                rescheduleRequest.getStartTime().isBefore(LocalTime.now())) {
            throw new UnavailabileException("Cannot reschedule to a time that has passed");
        }

        // 3. Get Availability & Calculate New End Time
        // We do this BEFORE validating working hours
        short duration = appointment.getServices().getEachServiceTimeInMinus();
        LocalTime newEndTime = rescheduleRequest.getStartTime().plusMinutes(duration);

        Availability availability = availabilityRepository.findByEmployee_EmployeeIdAndDay(
                appointment.getEmployee().getEmployeeId(),
                DayEnum.valueOf(rescheduleRequest.getDate().getDayOfWeek().name())
        ).orElseThrow(() -> new UnavailabileException("Employee is not working on " + rescheduleRequest.getDate().getDayOfWeek()));

        // 4. Validate Working Hours & Breaks
        if (availability.getIsAvailable() == AvailabileEnum.UNAVAILABILE) {
            throw new UnavailabileException("Employee is marked unavailable for this date");
        }

        if (rescheduleRequest.getStartTime().isBefore(availability.getOpenTime()) ||
                newEndTime.isAfter(availability.getCloseTime())) {
            throw new UnavailabileException("Time is outside working hours");
        }

        // Check for Breaks (using your break logic)
        // Assuming you have the isDuringAnyBreak helper available or inject it
        // if (isDuringAnyBreak(rescheduleRequest.getStartTime(), newEndTime, availability.getOffTime())) { ... }

        // 5. Overlap Check (CRITICAL: Must Exclude Current ID)
        boolean isSlotTaken = appointmentRepository.existsByOverlapExcludingCurrent(
                appointment.getEmployee().getEmployeeId(),
                rescheduleRequest.getDate(),
                rescheduleRequest.getStartTime(),
                newEndTime,
                appointment.getAppointmentId() // <--- This prevents the self-conflict
        );

        if (isSlotTaken) {
            throw new IllegalStateException("The selected time slot is already booked.");
        }

        // 6. Save
        appointment.setAppointmentDate(rescheduleRequest.getDate());
        appointment.setStartTime(rescheduleRequest.getStartTime());
        appointment.setEndTime(newEndTime);
        appointment.setUpdatedAt(LocalDateTime.now());

        appointmentRepository.save(appointment);

        // Create notification
        notificationService.createNotification(
                userId,
                "Booking Rescheduled",
                "Your appointment for " + appointment.getServices().getServiceName() +
                        " has been rescheduled to " + rescheduleRequest.getDate() +
                        " at " + rescheduleRequest.getStartTime() + ".",
                NotificationType.BOOKING_RESCHEDULED,
                appointment.getConfirmationNumber()
        );
    }

    @Override
    public List<GetAppointmentsWithPropertyID> getAppointments(Long propertyId, LocalDate date, Long userId) {
        // Authorize: the caller must be the partner who owns this property,
        // its assigned manager, OR its assigned receptionist. Previously this
        // endpoint had no ownership check at all — any authenticated
        // partner/manager token could view any property's appointments by
        // guessing a propertyId.
        propertyRepository.findByPropertyIdAuthorizedForAppointments(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you don't have access to it"));

        return appointmentRepository.findAllAppointmentsWithPropertyIdAndDate(propertyId, date.toString());
    }

    private void validateAppointment(Long employeeId, LocalDate date, LocalTime startTime, LocalTime endTime) {

        // 1. CHECK: Is the date/time in the past?
        // We don't want users booking yesterday or 5 minutes ago.
        if (date.isBefore(LocalDate.now())) {
            throw new UnavailabileException("Cannot book appointments in the past");
        }

        if (date.isEqual(LocalDate.now()) && startTime.isBefore(LocalTime.now())) {
            throw new UnavailabileException("Cannot book a time that has already passed today");
        }

        // 2. CHECK: Employee Availability Logic
        DayEnum dayName = DayEnum.valueOf(date.getDayOfWeek().name());

        Availability availability = availabilityRepository.findByEmployee_EmployeeIdAndDay(employeeId, dayName)
                .orElseThrow(() -> new UnavailabileException("Employee is not working on " + dayName));

        if (availability.getIsAvailable() == AvailabileEnum.UNAVAILABILE) {
            throw new UnavailabileException("Employee is marked unavailable for this date");
        }

        // 3. CHECK: Is the time strictly within working hours?
        // Start time cannot be before Open Time
        // End time cannot be after Close Time
        if (startTime.isBefore(availability.getOpenTime()) || endTime.isAfter(availability.getCloseTime())) {
            throw new UnavailabileException("Requested time is outside employee's working hours (" +
                    availability.getOpenTime() + " - " + availability.getCloseTime() + ")");
        }

        // 4. CHECK: Overlaps
        boolean isSlotTaken = appointmentRepository.existsByOverlap(
                employeeId,
                date,
                startTime,
                endTime
        );

        if (isSlotTaken) {
            throw new AlreadyExistsException("This time slot is already booked.");
        }
    }
}