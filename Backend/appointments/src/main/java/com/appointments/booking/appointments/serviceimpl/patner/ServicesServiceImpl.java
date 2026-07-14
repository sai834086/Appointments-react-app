package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.ServicesMapStruct;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.payload.request.patner.serviceRequest.ServicesDTO;
import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.patner.ServicesRepository;
import com.appointments.booking.appointments.service.patner.ServicesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServicesServiceImpl implements ServicesService {

    private final PropertyRepository propertyRepository;
    private final ServicesMapStruct servicesMapStruct;
    private final ServicesRepository servicesRepository;

    @Autowired
    public ServicesServiceImpl(PropertyRepository propertyRepository,
                               ServicesMapStruct servicesMapStruct,
                               ServicesRepository servicesRepository) {
        this.propertyRepository = propertyRepository;
        this.servicesMapStruct = servicesMapStruct;
        this.servicesRepository = servicesRepository;
    }

    // ----------------------------------------------------------------
    // 1. ADD SERVICE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void addService(ServicesDTO dto, Long propertyId, Long userId) {

        // FIXED: Fetching property via the new PartnerUser -> AppUser path
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Property Not found or Unauthorized"));

        // Validation: Case-insensitive name check within this property
        List<String> existingNames = servicesRepository.findByServiceNamesWithPropertyId(propertyId);

        if(existingNames.contains(dto.getServiceName().toUpperCase())){
            throw new AlreadyExistsException("Service name already exists in this property");
        }

        Services services = servicesMapStruct.toEntity(dto);
        services.setProperty(property);

        servicesRepository.save(services);
    }

    // ----------------------------------------------------------------
    // 2. UPDATE SERVICE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void updateService(ServicesDTO dto, Long serviceId, Long userId) {

        // FIXED: Verifying service ownership through the updated traversal path
        Services service = servicesRepository.findByServiceIdAndProperty_partnerUser_appUser_UserId(serviceId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Service not found or Unauthorized"));

        // Validation: Duplicate check if name is changed
        if (dto.getServiceName() != null && !dto.getServiceName().equalsIgnoreCase(service.getServiceName())) {
            List<String> existingNames = servicesRepository.findByServiceNamesWithPropertyId(service.getProperty().getPropertyId());
            if(existingNames.contains(dto.getServiceName().toUpperCase())){
                throw new AlreadyExistsException("Service name already exists");
            }
        }

        servicesMapStruct.updateServices(dto, service);
        servicesRepository.save(service);
    }

    // ----------------------------------------------------------------
    // 3. GET SERVICES (By Property)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<ServicesResponse> getServices(Long propertyId, Long userId) {

        // Authorize: userId must be either the owning partner OR the
        // property's assigned manager (see PropertyRepository for why).
        propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Services not found or Unauthorized"));

        List<Services> servicesList = servicesRepository.findByProperty_PropertyId(propertyId);

        List<ServicesResponse> responses = servicesMapStruct.servicesToServicesDto(servicesList);
        // employeeCount is not mapped by MapStruct (see mapper note) — stamp
        // it here. Also guard status for legacy rows created before the
        // column existed: derive from the employee link when NULL.
        for (int i = 0; i < servicesList.size(); i++) {
            Services entity = servicesList.get(i);
            ServicesResponse response = responses.get(i);
            List<Employee> users = entity.getEmployees();
            response.setEmployeeCount(users == null ? 0 : users.size());
            if (response.getStatus() == null) {
                response.setStatus(entity.computeStatusFromEmployees());
            }
        }
        return responses;
    }

    // ----------------------------------------------------------------
    // 4. GET SERVICES (By Employee)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<ServicesResponse> getEmployeeServices(Long employeeId, Long userId) {

        // Ensure ServicesRepository.findServicesByEmployeeId query is updated to match new path
        List<Services> services = servicesRepository.findServicesByEmployeeId(employeeId, userId);

        return services.stream()
                .map((service) -> {
                    ServicesResponse response = servicesMapStruct.toDto(service);
                    List<Employee> users = service.getEmployees();
                    response.setEmployeeCount(users == null ? 0 : users.size());
                    if (response.getStatus() == null) {
                        response.setStatus(service.computeStatusFromEmployees());
                    }
                    return response;
                })
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // 5. DELETE SERVICE
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void deleteService(Long serviceId, Long propertyId, Long userId) {

        // FIXED: Secure fetch using the deep traversal path
        Services service = servicesRepository.findByServiceIdAndProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
                        serviceId, propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Service not found or unauthorized"));

        // Unlink from all Employees before deletion to prevent constraint violations
        List<Employee> employeesWithService = new ArrayList<>(service.getEmployees());

        for (Employee employee : employeesWithService) {
            employee.getServices().remove(service);
        }

        servicesRepository.delete(service);
    }
}