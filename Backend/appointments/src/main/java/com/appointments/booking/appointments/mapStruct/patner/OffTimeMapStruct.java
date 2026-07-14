package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.model.patner.OffTime;
import com.appointments.booking.appointments.payload.request.patner.offTimeRequest.OffTimeRegisterRequest;
import com.appointments.booking.appointments.payload.response.patner.offTimeResponse.GetAllOffTimeResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OffTimeMapStruct {

    // 1. DTO -> Entity
    OffTime toEntity(OffTimeRegisterRequest dto);

    // 2. Entity -> Response
    GetAllOffTimeResponse toResponse(OffTime offTime);

    // 3. List Mapping (Add this!)
    // MapStruct generates the loop automatically using the 'toResponse' method above.
    List<GetAllOffTimeResponse> toResponseList(List<OffTime> offTimes);
}