package com.appointments.booking.appointments.serviceimpl.user;

import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.exception.UnavailabileException;
import com.appointments.booking.appointments.mapStruct.patner.*;
import com.appointments.booking.appointments.model.appointment.Appointments;
import com.appointments.booking.appointments.model.enums.AppointmentStatus;
import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.appointments.booking.appointments.model.patner.*;
import com.appointments.booking.appointments.payload.response.user.BookingsResponse;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilitySlotsResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.payload.response.user.*;
import com.appointments.booking.appointments.repository.appointments.AppointmentRepository;
import com.appointments.booking.appointments.repository.patner.*;
import com.appointments.booking.appointments.service.notification.NotificationService;
import com.appointments.booking.appointments.service.user.AppUserDataFetchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppUserDataFetchServiceImpl implements AppUserDataFetchService {

    private final PartnerUserRepository partnerUserRepository;
    private final PartnerUserMapStruct partnerUserMapStruct;
    private final PropertyRepository propertyRepository;
    private final PropertyMapStruct propertyMapStruct;
    private final EmployeeRepository employeeRepository;
    private final EmployeeMapStruct employeeMapStruct;
    private final AvailabilityRepository availabilityRepository;
    private final ServicesRepository servicesRepository;
    private final ServicesMapStruct servicesMapStruct;
    private final AvailabilityGenerator availabilityGenerator;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Autowired
    public AppUserDataFetchServiceImpl(PartnerUserRepository partnerUserRepository,
                                       PartnerUserMapStruct partnerUserMapStruct,
                                       PropertyRepository propertyRepository,
                                       PropertyMapStruct propertyMapStruct,
                                       EmployeeRepository employeeRepository,
                                       EmployeeMapStruct employeeMapStruct,
                                       AvailabilityRepository availabilityRepository,
                                       ServicesRepository servicesRepository,
                                       ServicesMapStruct servicesMapStruct,
                                       AvailabilityGenerator availabilityGenerator,
                                       AppointmentRepository appointmentRepository,
                                       NotificationService notificationService) {
        this.partnerUserRepository = partnerUserRepository;
        this.partnerUserMapStruct = partnerUserMapStruct;
        this.propertyRepository = propertyRepository;
        this.propertyMapStruct = propertyMapStruct;
        this.employeeRepository = employeeRepository;
        this.employeeMapStruct = employeeMapStruct;
        this.availabilityRepository = availabilityRepository;
        this.servicesRepository = servicesRepository;
        this.servicesMapStruct = servicesMapStruct;
        this.availabilityGenerator = availabilityGenerator;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
    }

    // 1. FETCH ALL PARTNERS (Filters by Location) — includes property and service counts for card display
    @Override
    @Transactional(readOnly = true)
    public List<AllPartnerUsersToAppUsers> getAllPartners(String country, String state, String city) {
        List<PartnerUser> partnerUsers = partnerUserRepository.findAllPartnerUsersWithAddress(country, state, city);
        List<AllPartnerUsersToAppUsers> dtos = partnerUserMapStruct.toDtoList(partnerUsers);

        for (AllPartnerUsersToAppUsers dto : dtos) {
            Long partnerId = dto.getPartnerId();
            dto.setPropertyCount(propertyRepository.countByPartnerUser_PartnerId(partnerId));
            dto.setServiceCount(servicesRepository.countByProperty_PartnerUser_PartnerId(partnerId));
        }

        return dtos;
    }

    // 2. FETCH ALL PROPERTIES (For a Specific Partner)
    @Override
    @Transactional(readOnly = true)
    public List<AllPropertiesToAppUsers> getAllProperties(Long partnerId) {
        // FIXED: Using the corrected path Property -> PartnerUser -> AppUser
        List<Property> properties = propertyRepository.findByPartnerUser_AppUser_UserId(partnerId);
        return propertyMapStruct.toDtoList(properties);
    }

    // 3. FETCH ALL EMPLOYEES (For a Specific Property)
    @Override
    public List<EmployeeDTO> getAllEmployees(Long propertyId) {
        List<Employee> employees = employeeRepository.findByProperty_propertyId(propertyId);
        return employeeMapStruct.toDtoList(employees);
    }

    // 4. FETCH EMPLOYEE AVAILABILITY
    @Override
    public EmployeeAvailabilityResponse getEmployeeAvailabilityWithEmployeeId(Long employeeId) {
        Employee employee = employeeRepository.findEmployeeWithAvailability(employeeId);

        List<String> availableDays = employee.getAvailability().stream()
                .filter(a -> a.getIsAvailable() == AvailabileEnum.AVAILABILE)
                .map(a -> a.getDay().name())
                .toList();

        return EmployeeAvailabilityResponse.builder()
                .availableDays(availableDays)
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .employeeId(employee.getEmployeeId())
                .appointmentsOpenTillInMonths(employee.getAppointmentsOpenTillInMonths())
                .build();
    }

    // 5. FETCH SINGLE EMPLOYEE DETAILS
    @Override
    public EmployeeResponseWithServices getEmployee(Long employeeId) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId);
        return employeeMapStruct.toResponse(employee);
    }

    @Override
    public List<PropertiesWithEmployees> getAllPropertiesWithEmployees(Long partnerId) {
        // Implementation can follow a grouping strategy similar to getAllServicesByPartner if needed
        return List.of();
    }

    // 6. FETCH ALL SERVICES (Grouped by Property)
    @Override
    @Transactional(readOnly = true)
    public List<PropertyWithServicesResponse> getAllServicesByPartner( Long partnerId) {


        // 2. FETCH SERVICES: Navigate via Property -> PartnerUser
        List<Services> allServices = servicesRepository.findByProperty_PartnerUser_PartnerId(partnerId);

        if (allServices.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. GROUPING LOGIC: Organize services by Property
        Map<Long, PropertyWithServicesResponse> responseMap = new LinkedHashMap<>();

        for (Services service : allServices) {
            Property property = service.getProperty();
            if (property == null) continue;

            PropertyWithServicesResponse propertyResponse = responseMap.computeIfAbsent(
                    property.getPropertyId(),
                    id -> PropertyWithServicesResponse.builder()
                            .propertyId(property.getPropertyId())
                            .propertyName(property.getPropertyName())
                            .buildingNo(property.getBuildingNo())
                            .street(property.getStreet())
                            .city(property.getCity())
                            .state(property.getState())
                            .country(property.getCountry())
                            .servicesResponses(new ArrayList<>())
                            .build()
            );

            // Map service entity → DTO, then set the live employee count
            long empCount = employeeRepository.countByServices_ServiceId(service.getServiceId());

            // Skip services with no assigned employees
            if (empCount == 0) continue;

            com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse serviceDto
                    = servicesMapStruct.toDto(service);
            serviceDto.setEmployeeCount(empCount);

            propertyResponse.getServicesResponses().add(serviceDto);
        }

        // Remove property groups that have no eligible services
        responseMap.values().removeIf(p -> p.getServicesResponses().isEmpty());

        return new ArrayList<>(responseMap.values());
    }

    // 7. FETCH EMPLOYEES FOR A SPECIFIC SERVICE
    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDTO> getEmployeesForService(Long propertyId, Long serviceId) {
        List<Employee> employees = employeeRepository.findByServices_ServiceIdAndProperty_PropertyId(serviceId, propertyId);

        if (employees.isEmpty()) {
            throw new UsernameNotFoundException("No employees found for this service");
        }

        return employees.stream()
                .map(emp -> EmployeeDTO.builder()
                        .employeeId(emp.getEmployeeId())
                        .firstName(emp.getFirstName())
                        .lastName(emp.getLastName())
                        .build())
                .collect(Collectors.toList());
    }

    // 8. GENERATE TIME SLOTS
    @Override
    public AvailabilitySlotsResponse getAvailabileSlots(Long serviceId, Long employeeId, LocalDate date) {
        Availability availability = availabilityRepository.findByEmployee_EmployeeIdAndDay(employeeId, DayEnum.valueOf(date.getDayOfWeek().toString()))
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Availability not found for this day"));

        Services services = servicesRepository.findById(serviceId)
                .orElseThrow(() -> new UnavailabileException("Service Not Found"));

        if (availability.getIsAvailable() == AvailabileEnum.UNAVAILABILE) {
            throw new UnavailabileException("Employee unavailable for selected date");
        }

        List<LocalTime> availabileSlots = availabilityGenerator.generateTimeSlots(availability, date, services.getEachServiceTimeInMinus());

        return AvailabilitySlotsResponse.builder()
                .employeeId(employeeId)
                .localDate(date)
                .availabileSlots(availabileSlots)
                .build();
    }

    // 9. FETCH USER BOOKINGS
    @Override
    @Transactional(readOnly = true)
    public List<BookingsResponse> getAllBookings(Long appUserId) {
        // FIXED: Ensure AppointmentRepository has findByCustomer_UserId
        List<Appointments> appointments = appointmentRepository.findByCustomer_UserId(appUserId);

        return appointments.stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    // 10. CANCEL BOOKING
    @Override
    @Transactional
    public void cancelBooking(Long appUserId, Long appointmentId) {
        Appointments appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Appointment not found"));

        if (!appointment.getCustomer().getUserId().equals(appUserId)) {
            throw new InvalidException("You are not authorized to cancel this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.Completed) {
            throw new IllegalStateException("Cannot cancel an appointment that is already completed.");
        }

        if (appointment.getStatus() == AppointmentStatus.Cancelled) {
            throw new IllegalStateException("Appointment is already cancelled.");
        }

        appointment.setStatus(AppointmentStatus.Cancelled);
        appointmentRepository.save(appointment);

        // Create notification
        notificationService.createNotification(
                appUserId,
                "Booking Cancelled",
                "Your appointment for " + appointment.getServices().getServiceName() +
                        " on " + appointment.getAppointmentDate() +
                        " has been cancelled.",
                com.appointments.booking.appointments.model.notification.NotificationType.BOOKING_CANCELLED,
                appointment.getConfirmationNumber()
        );
    }

    // HELPER: Map to DTO
    private BookingsResponse mapToBookingResponse(Appointments appointment) {
        return BookingsResponse.builder()
                .appointmentId(appointment.getAppointmentId())
                // Safety check for Services
                .serviceId(appointment.getServices() != null ? appointment.getServices().getServiceId() : null)
                // Safety check for Employee
                .employeeId(appointment.getEmployee() != null ? appointment.getEmployee().getEmployeeId() : null)
                .bookedAt(appointment.getBookedAt())
                .updatedAt(appointment.getUpdatedAt())
                .confirmationNumber(appointment.getConfirmationNumber())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                // Corrected field mapping
                .serviceTimeInMinus(appointment.getServices() != null
                        ? appointment.getServices().getEachServiceTimeInMinus()
                        : 0)
                .status(appointment.getStatus())
                .serviceName(appointment.getServices() != null
                        ? appointment.getServices().getServiceName()
                        : "Unknown Service")
                .employeeName(appointment.getEmployee() != null
                        ? appointment.getEmployee().getFirstName() + " " + appointment.getEmployee().getLastName()
                        : "Unknown Employee")

                .propertyName(appointment.getProperty() != null
                        ? appointment.getProperty().getPropertyName()
                        : "Unknown Property")
                .propertyAddress(appointment.getProperty() != null
                        ? String.join(", ",
                            java.util.stream.Stream.of(
                                appointment.getProperty().getBuildingNo(),
                                appointment.getProperty().getCity(),
                                appointment.getProperty().getState()
                            ).filter(s -> s != null && !s.isEmpty()).toArray(String[]::new))
                        : "")
                .build();
    }

}
