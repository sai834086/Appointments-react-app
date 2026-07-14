package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.mapStruct.patner.ServicesMapStruct; // Import the service mapper
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.payload.response.user.EmployeeDTO;
import org.mapstruct.*;

import java.util.List;

// 1. Add 'uses' to reuse ServicesMapStruct
@Mapper(componentModel = "spring", uses = {ServicesMapStruct.class})
public interface EmployeeMapStruct {

    // ----------------------------------------------------------------
    // 1. REQUEST -> ENTITY
    // ----------------------------------------------------------------
    Employee toEmployee(EmployeeRegisterRequest employeeRegisterRequest);

    Employee toEmployee(EmployeeUpdateRequest employeeUpdateRequest);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(EmployeeUpdateRequest dto, @MappingTarget Employee employee);

    // ----------------------------------------------------------------
    // 2. ENTITY -> RESPONSE (Detailed with Services)
    // ----------------------------------------------------------------

    // MapStruct will automatically use ServicesMapStruct to convert List<Services> -> List<ServicesResponse>
    // You don't need 'qualifiedByName' anymore!
    @Mapping(source = "services", target = "servicesList")
    EmployeeResponseWithServices toResponse(Employee employee);

    List<EmployeeResponseWithServices> toResponse(List<Employee> employees);


    // ----------------------------------------------------------------
    // 3. ENTITY -> RESPONSE (Simple Lists)
    // ----------------------------------------------------------------

    // Fixed naming convention (camelCase)
    List<EmployeeResponse> toEmployeeResponseList(List<Employee> employees);

    // Fixed typo (toDoList -> toDtoList)
    List<EmployeeDTO> toDtoList(List<Employee> employees);
}