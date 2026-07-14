package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.EmployeeMapStruct;
import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.repository.patner.AvailabilityRepository;
import com.appointments.booking.appointments.repository.patner.EmployeeRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.patner.ServicesRepository;
import com.appointments.booking.appointments.service.patner.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapStruct employeeMapStruct;
    private final PropertyRepository propertyRepository;
    private final AvailabilityRepository availabilityRepository;
    private final ServicesRepository servicesRepository;

    @Autowired
    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               EmployeeMapStruct employeeMapStruct,
                               PropertyRepository propertyRepository,
                               AvailabilityRepository availabilityRepository,
                               ServicesRepository servicesRepository) {
        this.employeeRepository = employeeRepository;
        this.employeeMapStruct = employeeMapStruct;
        this.propertyRepository = propertyRepository;
        this.availabilityRepository = availabilityRepository;
        this.servicesRepository = servicesRepository;
    }

    // ----------------------------------------------------------------
    // 1. REGISTER EMPLOYEE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void saveEmployee(EmployeeRegisterRequest dto, Long propertyId, Long userId) {

        String employeeFullNameFromDTO =
                (dto.getFirstName() != null ? dto.getFirstName() : "") + " " +
                        (dto.getLastName() != null ? dto.getLastName() : "");

        List<String> existingNames = employeeRepository.fullName(propertyId);
        if (existingNames.contains(employeeFullNameFromDTO.trim())) {
            throw new AlreadyExistsException("Employee with this name already exists in this property");
        }

        // UPDATED: Path updated to match Property's relationship with partnerUser
        // inside saveEmployee method
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Unauthorized or Property not found"));

        Employee employee = employeeMapStruct.toEmployee(dto);
        employee.setProperty(property);

        if (employee.getStatus() == null || employee.getAppointmentsOpenTillInMonths() == 0) {
            employee.setStatus(StatusEnum.INACTIVE);
            employee.setAppointmentsOpenTillInMonths((short) 3);
        }

        employeeRepository.save(employee);

        List<Availability> defaultAvailabilities = Arrays.stream(DayEnum.values())
                .map(day -> {
                    Availability availability = new Availability();
                    availability.setDay(day);
                    availability.setIsAvailable(AvailabileEnum.UNAVAILABILE);
                    availability.setOpenTime(null);
                    availability.setCloseTime(null);
                    availability.setEmployee(employee);
                    return availability;
                })
                .collect(Collectors.toList());

        availabilityRepository.saveAll(defaultAvailabilities);
    }

    // ----------------------------------------------------------------
    // 2. GET ALL EMPLOYEES (With Services)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponseWithServices> getAllEmployeesWithServices(Long propertyId, Long userId) {
        // Authorize: userId must be either the owning partner OR the
        // property's assigned manager (see PropertyRepository for why).
        propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Unauthorized or Property not found"));

        List<Employee> employees = employeeRepository.findByProperty_propertyId(propertyId);

        return employeeMapStruct.toResponse(employees);
    }

    // ----------------------------------------------------------------
    // 3. GET ALL EMPLOYEES (Simple List)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getEmployees(Long propertyId, Long userId) {
        // Authorize: userId must be either the owning partner OR the
        // property's assigned manager (see PropertyRepository for why).
        propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Unauthorized or Property not found"));

        List<Employee> employees = employeeRepository.findByProperty_propertyId(propertyId);

        return employeeMapStruct.toEmployeeResponseList(employees);
    }

    // ----------------------------------------------------------------
    // 4. UPDATE EMPLOYEE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void updateEmployee(EmployeeUpdateRequest dto, Long employeeId, Long propertyId, Long userId) {

        // UPDATED: Path now includes partnerUser
        Employee existingEmployee = employeeRepository.findByEmployeeIdAndProperty_partnerUser_appUser_UserId(employeeId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Unauthorized or Employee not found"));

        String newFullName = (dto.getFirstName() + " " + dto.getLastName()).trim();
        String currentFullName = (existingEmployee.getFirstName() + " " + existingEmployee.getLastName()).trim();

        if(!newFullName.equalsIgnoreCase(currentFullName)) {
            List<String> existingNames = employeeRepository.fullName(propertyId);
            if (existingNames.contains(newFullName)) {
                throw new AlreadyExistsException("Employee name already exists");
            }
        }

        employeeMapStruct.updateEntityFromDto(dto, existingEmployee);
        employeeRepository.save(existingEmployee);
    }

    // ----------------------------------------------------------------
    // 5. DELETE EMPLOYEE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void deleteEmployeeById(Long employeeId, Long userId){
        // UPDATED: Path now includes partnerUser
        Employee employee = employeeRepository.findByEmployeeIdAndProperty_partnerUser_appUser_UserId(employeeId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Employee not found or Unauthorized"));

        // Capture the services this employee offered BEFORE deleting, so
        // their statuses can be re-derived once the links are gone.
        List<Services> affectedServices =
                employee.getServices() == null ? List.of() : new ArrayList<>(employee.getServices());

        employeeRepository.delete(employee);

        for (Services service : affectedServices) {
            long remainingUsers = employeeRepository.countByServices_ServiceId(service.getServiceId());
            service.setStatus(remainingUsers > 0 ? StatusEnum.ACTIVE : StatusEnum.INACTIVE);
        }
        if (!affectedServices.isEmpty()) {
            servicesRepository.saveAll(affectedServices);
        }
    }

    // ----------------------------------------------------------------
    // 6. ADD SERVICES TO EMPLOYEE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void addServicesToEmployee(Long employeeId, List<Long> serviceIds, Long propertyId, Long userId) {

        // UPDATED: Path now includes partnerUser
        Employee employee = employeeRepository.findByEmployeeIdAndProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
                        employeeId, propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Employee not found or unauthorized"));

        List<Services> servicesToAdd = servicesRepository.findByServiceIdInAndProperty_PropertyId(serviceIds, propertyId);

        if (servicesToAdd.size() != serviceIds.size()) {
            throw new InvalidException("Some services were not found or do not belong to this property");
        }

        if (employee.getServices() == null) {
            employee.setServices(new ArrayList<>());
        }

        for (Services service : servicesToAdd) {
            if (!employee.getServices().contains(service)) {
                employee.getServices().add(service);
            }
            // A service with at least one employee offering it is ACTIVE.
            service.setStatus(StatusEnum.ACTIVE);
        }

        employeeRepository.save(employee);
        servicesRepository.saveAll(servicesToAdd);
    }

    // ----------------------------------------------------------------
    // 7. REMOVE SERVICE FROM EMPLOYEE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void removeServiceFromEmployee(Long employeeId, Long serviceId, Long propertyId, Long userId) {

        // UPDATED: Path now includes partnerUser
        Employee employee = employeeRepository.findByEmployeeIdAndProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
                        employeeId, propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Employee not found or unauthorized"));

        Services service = servicesRepository.findByServiceIdAndProperty_PropertyId(serviceId, propertyId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Service not found in this property"));

        if (employee.getServices() != null) {
            employee.getServices().remove(service);
        }

        employeeRepository.save(employee);

        // Re-derive the service's status: it goes INACTIVE when the last
        // employee stops offering it. (The JPQL count auto-flushes the
        // pending join-table change first, so the number is current.)
        long remainingUsers = employeeRepository.countByServices_ServiceId(serviceId);
        service.setStatus(remainingUsers > 0 ? StatusEnum.ACTIVE : StatusEnum.INACTIVE);
        servicesRepository.save(service);
    }
}