package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeUpdateRequest;
import com.appointments.booking.appointments.payload.request.patner.serviceRequest.ServicesDTO;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.payload.response.user.EmployeeDTO;

import java.util.List;
import java.util.Optional;

public interface EmployeeService {

    void saveEmployee(EmployeeRegisterRequest dto, Long propertyId, Long partnerId);

    List<EmployeeResponseWithServices> getAllEmployeesWithServices(Long propertyId, Long partnerId);

    void updateEmployee(EmployeeUpdateRequest employeeUpdateRequest, Long employeeId, Long propertyId, Long partnerId);


    void deleteEmployeeById(Long employeeId, Long partnerId);


    List<EmployeeResponse> getEmployees(Long propertyId, Long partnerId);


    void addServicesToEmployee(Long employeeId, List<Long> serviceIds, Long propertyId, Long partnerId);

    void removeServiceFromEmployee(Long employeeId, Long serviceId, Long propertyId, Long partnerId);




    }

