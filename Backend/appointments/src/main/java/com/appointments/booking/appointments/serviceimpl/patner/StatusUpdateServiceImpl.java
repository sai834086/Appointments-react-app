package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.repository.patner.AvailabilityRepository;
import com.appointments.booking.appointments.repository.patner.EmployeeRepository;
import com.appointments.booking.appointments.repository.patner.PartnerUserRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.patner.ServicesRepository;
import com.appointments.booking.appointments.service.patner.StatusUpdateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StatusUpdateServiceImpl implements StatusUpdateService {

    private final AvailabilityRepository availabilityRepository;
    private final EmployeeRepository employeeRepository;
    private final PropertyRepository propertyRepository;
    private final PartnerUserRepository partnerUserRepository;
    private final ServicesRepository servicesRepository;

    @Autowired
    public StatusUpdateServiceImpl(AvailabilityRepository availabilityRepository,
                                   EmployeeRepository employeeRepository,
                                   PropertyRepository propertyRepository,
                                   PartnerUserRepository partnerUserRepository,
                                   ServicesRepository servicesRepository) {
        this.availabilityRepository = availabilityRepository;
        this.employeeRepository = employeeRepository;
        this.propertyRepository = propertyRepository;
        this.partnerUserRepository = partnerUserRepository;
        this.servicesRepository = servicesRepository;
    }

    @Override
    @Transactional
    public void updateStatuses(Long ownerId) {

        // --- 1. Update Employee Status ---
        // Uses the corrected path: property -> partnerUser -> appUser
        List<Employee> employees = employeeRepository.findByProperty_partnerUser_appUser_UserId(ownerId);

        for (Employee employee : employees) {
            boolean isAvailable = availabilityRepository.existsByEmployee_EmployeeIdAndIsAvailable(
                    employee.getEmployeeId(), AvailabileEnum.AVAILABILE);
            employee.setStatus(isAvailable ? StatusEnum.ACTIVE : StatusEnum.INACTIVE);
        }
        employeeRepository.saveAll(employees);

        // --- 1b. Update Service Status ---
        // A service is ACTIVE while at least one employee offers it. This
        // bulk pass also backfills legacy rows created before the status
        // column existed.
        List<Services> services = servicesRepository.findAllByOwnerId(ownerId);
        for (Services service : services) {
            service.setStatus(service.computeStatusFromEmployees());
        }
        servicesRepository.saveAll(services);

        // --- 2. Update Property Status ---
        // 🔄 FIXED: Changed from findByAppUser_UserId to findByPartnerUser_AppUser_UserId
        List<Property> properties = propertyRepository.findByPartnerUser_AppUser_UserId(ownerId);
        boolean hasAnyActiveProperty = false;

        for (Property property : properties) {
            // A property is ACTIVE if at least one of its employees is ACTIVE
            boolean propertyHasActiveStaff = employees.stream()
                    .filter(e -> e.getProperty() != null && e.getProperty().getPropertyId().equals(property.getPropertyId()))
                    .anyMatch(e -> StatusEnum.ACTIVE.equals(e.getStatus()));

            StatusEnum newStatus = propertyHasActiveStaff ? StatusEnum.ACTIVE : StatusEnum.INACTIVE;
            property.setStatus(newStatus);

            if (newStatus == StatusEnum.ACTIVE) {
                hasAnyActiveProperty = true;
            }
        }
        propertyRepository.saveAll(properties);

        // --- 3. Update Partner Profile Status ---
        // Logic: The Partner Business is ACTIVE if they have at least 1 Active Property.
        PartnerUser partnerProfile = partnerUserRepository.findByAppUser_UserId(ownerId)
                .orElseThrow(() -> new RuntimeException("Partner profile not found for User ID: " + ownerId));

        StatusEnum newPartnerStatus = hasAnyActiveProperty ? StatusEnum.ACTIVE : StatusEnum.INACTIVE;

        if (!newPartnerStatus.equals(partnerProfile.getStatus())) {
            partnerProfile.setStatus(newPartnerStatus);
            partnerUserRepository.save(partnerProfile);
        }
    }
}