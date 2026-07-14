package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.AvailabilityMapStruct;
import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.payload.request.patner.availabilityRequests.AvailabilityUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityResponseWithOffTime;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.EmployeeWeeklySummaryResponse;
import com.appointments.booking.appointments.repository.patner.AvailabilityRepository;
import com.appointments.booking.appointments.repository.patner.EmployeeRepository;
import com.appointments.booking.appointments.service.patner.AvailabilityService;
import com.appointments.booking.appointments.service.patner.StatusUpdateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AvailabilityServiceImpl implements AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final AvailabilityMapStruct availabilityMapStruct;
    private final StatusUpdateService statusUpdateService;
    private final EmployeeRepository employeeRepository;

    @Autowired
    public AvailabilityServiceImpl(AvailabilityRepository availabilityRepository,
                                   AvailabilityMapStruct availabilityMapStruct,
                                   StatusUpdateService statusUpdateService,
                                   EmployeeRepository employeeRepository) {
        this.availabilityRepository = availabilityRepository;
        this.availabilityMapStruct = availabilityMapStruct;
        this.statusUpdateService = statusUpdateService;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional
    public void updateAvailability(AvailabilityUpdateRequest dto, Long userId, Long availabilityId) {

        // UPDATED: Path now includes partnerUser
        Availability existing = availabilityRepository.findByAvailabilityIdAndEmployee_Property_partnerUser_appUser_UserId(availabilityId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Unauthorized or availability not found"));

        availabilityMapStruct.updateEntity(dto, existing);
        availabilityRepository.save(existing);

        // Notify status service using the AppUser ID
        statusUpdateService.updateStatuses(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityResponseWithOffTime> getAllAvailabilityWithOffTimes(Long userId, Long employeeId) {

        // UPDATED: Path now includes partnerUser
        List<Availability> availabilities = availabilityRepository
                .findByEmployee_EmployeeIdAndEmployee_Property_partnerUser_appUser_UserId(employeeId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Unauthorized or no availabilities found"));

        return availabilityMapStruct.toDTOList(availabilities);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeWeeklySummaryResponse getEmployeeWeeklySummary(Long userId, Long employeeId) {

        // Verify the employee belongs to this partner before exposing any data.
        Employee employee = employeeRepository
                .findByEmployeeIdAndProperty_partnerUser_appUser_UserId(employeeId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Unauthorized or employee not found"));

        // Pull the availability rows (may legitimately be empty for a brand-new
        // employee — return an empty list rather than throwing).
        List<Availability> availabilities = availabilityRepository
                .findByEmployee_EmployeeIdAndEmployee_Property_partnerUser_appUser_UserId(employeeId, userId)
                .orElse(Collections.emptyList());

        List<String> availableDays = availabilities.stream()
                .filter(a -> a.getIsAvailable() == AvailabileEnum.AVAILABILE)
                .map(Availability::getDay)
                .filter(Objects::nonNull)
                .map(Enum::name)
                .distinct()
                .collect(Collectors.toList());

        return new EmployeeWeeklySummaryResponse(
                availableDays,
                employee.getAppointmentsOpenTillInMonths()
        );
    }
}