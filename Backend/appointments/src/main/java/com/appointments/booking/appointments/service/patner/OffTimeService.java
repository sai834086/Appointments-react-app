package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.request.patner.offTimeRequest.OffTimeRegisterRequest;
import com.appointments.booking.appointments.payload.response.patner.offTimeResponse.GetAllOffTimeResponse;
import java.util.List;

public interface OffTimeService {

    void registerOffTimeRequest(OffTimeRegisterRequest dto,Long partnerId, Long availabilityId);

    List<GetAllOffTimeResponse> getAllOffTime(Long availabilityId, Long partnerId);

    void deleteOffTime(Long partnerId, Long offTimeId);
}
