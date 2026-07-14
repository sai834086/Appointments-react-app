package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.mapStruct.patner.OffTimeMapStruct; // Import the other mapper
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.payload.request.patner.availabilityRequests.AvailabilityUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityResponseWithOffTime;
import org.mapstruct.*;

import java.util.List;

// Add 'uses' to reuse the existing OffTime mapper logic
@Mapper(componentModel = "spring", uses = {OffTimeMapStruct.class})
public interface AvailabilityMapStruct {

    // ----------------------------------------------------------------
    // 1. DTO -> Entity (For Updates)
    // ----------------------------------------------------------------
    Availability toEntity(AvailabilityUpdateRequest dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(AvailabilityUpdateRequest dto, @MappingTarget Availability existing);

    // ----------------------------------------------------------------
    // 2. Entity -> Response DTO
    // ----------------------------------------------------------------

    // Simple Response
    AvailabilityDetailsResponse toResponse(Availability availability);

    // Response WITH Nested OffTimes
    // MapStruct will automatically find 'toResponse' in OffTimeMapStruct
    // to map List<OffTime> -> List<GetAllOffTimeResponse>
    @Mapping(source = "offTime", target = "offTimes")
    AvailabilityResponseWithOffTime toDTO(Availability availability);

    // Map List (Automatically loops using the method above)
    List<AvailabilityResponseWithOffTime> toDTOList(List<Availability> availabilities);
}