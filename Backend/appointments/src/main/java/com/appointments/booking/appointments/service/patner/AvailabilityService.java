package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.request.patner.availabilityRequests.AvailabilityUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityResponseWithOffTime;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.EmployeeWeeklySummaryResponse;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvailabilityService {

    void updateAvailability(AvailabilityUpdateRequest dto, Long partnerId, Long availabilityId);

    List<AvailabilityResponseWithOffTime> getAllAvailabilityWithOffTimes(Long partnerId, Long employeeId);

    /**
     * Compact summary for the partner Employees grid: which weekdays are
     * AVAILABILE plus the employee's booking window in months.
     */
    EmployeeWeeklySummaryResponse getEmployeeWeeklySummary(Long partnerId, Long employeeId);


}
