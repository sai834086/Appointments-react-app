package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.PropertyDetailsResponse;
import com.appointments.booking.appointments.payload.response.user.AllPropertiesToAppUsers;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PropertyMapStruct {

    // ----------------------------------------------------------------
    // 1. REQUEST -> ENTITY
    // ----------------------------------------------------------------
    // We ignore 'owner' and 'status' here because they are set in the Service layer
    @Mapping(target = "propertyId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "manager", ignore = true) // Handled in Service
    @Mapping(target = "employees", ignore = true)
    @Mapping(target = "services", ignore = true)
    Property toEntity(PropertyRegisterRequest dto);

    // ----------------------------------------------------------------
    // 2. ENTITY -> RESPONSE (Detailed Owner View)
    // ----------------------------------------------------------------
    // Flat contact fields come from the property's manager. The nested
    // manager object is populated in the service layer (so we ignore it here).
    @Mapping(target = "firstName", source = "manager.firstName")
    @Mapping(target = "lastName", source = "manager.lastName")
    @Mapping(target = "email", source = "manager.email")
    @Mapping(target = "phoneNumber", source = "manager.phoneNumber")
    @Mapping(target = "manager", ignore = true)
    PropertyDetailsResponse toResponse(Property property);

    List<PropertyDetailsResponse> toResponse(List<Property> properties);

    // ----------------------------------------------------------------
    // 3. UPDATE ENTITY
    // ----------------------------------------------------------------
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "manager", ignore = true)
    void updateEntityFromDto(PropertyUpdateRequest dto, @MappingTarget Property property);

    // ----------------------------------------------------------------
    // 4. ENTITY -> PUBLIC DTO (User View)
    // ----------------------------------------------------------------
    // Fixed Typo: toDoList -> toDtoList
    List<AllPropertiesToAppUsers> toDtoList(List<Property> properties);

}
