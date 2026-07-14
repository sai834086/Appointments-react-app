package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.payload.request.patner.serviceRequest.ServicesDTO;
import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ServicesMapStruct {

    // ----------------------------------------------------------------
    // 1. REQUEST -> ENTITY
    // ----------------------------------------------------------------
    // We ignore ID and Property because they are handled by the Database/Service
    @Mapping(target = "serviceId", ignore = true)
    @Mapping(target = "property", ignore = true)
    @Mapping(target = "employees", ignore = true)
    Services toEntity(ServicesDTO dto);

    // ----------------------------------------------------------------
    // 2. ENTITY -> RESPONSE
    // ----------------------------------------------------------------
    // employeeCount is not on the entity — set it manually after calling toDto()
    @Mapping(target = "employeeCount", ignore = true)
    ServicesResponse toDto(Services services);

    // MapStruct automatically loops using the 'toDto' method above
    List<ServicesResponse> servicesToServicesDto(List<Services> servicesList);

    // ----------------------------------------------------------------
    // 3. UPDATE ENTITY
    // ----------------------------------------------------------------
    @Mapping(target = "serviceId", ignore = true)
    @Mapping(target = "property", ignore = true)
    @Mapping(target = "employees", ignore = true) // Employees are managed via specific add/remove endpoints
    void updateServices(ServicesDTO dto, @MappingTarget Services service);

}