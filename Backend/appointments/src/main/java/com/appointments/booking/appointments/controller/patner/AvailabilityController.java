package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.availabilityRequests.AvailabilityUpdateRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilityResponseWithOffTime;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.EmployeeWeeklySummaryResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.AvailabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
@PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @PatchMapping("partnerUser/updateAvailability/{availabilityId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateAvailability(
            @RequestBody AvailabilityUpdateRequest dto,
            @PathVariable Long availabilityId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        availabilityService.updateAvailability(dto, jwtUserDetails.getId(), availabilityId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Availability updated successfully"));
    }

    @GetMapping("partnerUser/getAvailabilityWithOffTime/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailabilityWithOffTime(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        Long userId = jwtUserDetails.getId();

        List<AvailabilityResponseWithOffTime> result =
                availabilityService.getAllAvailabilityWithOffTimes(userId, employeeId);

        // Aggregate summary for the partner Employees grid card.
        EmployeeWeeklySummaryResponse summary =
                availabilityService.getEmployeeWeeklySummary(userId, employeeId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("availabilityWithOffTime", result);
        payload.put("availableDays", summary.getAvailableDays());
        payload.put("appointmentsOpenTillInMonths", summary.getAppointmentsOpenTillInMonths());

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @GetMapping("partnerUser/getEmployeeWeeklySummary/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeWeeklySummaryResponse>> getEmployeeWeeklySummary(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        EmployeeWeeklySummaryResponse summary =
                availabilityService.getEmployeeWeeklySummary(jwtUserDetails.getId(), employeeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "success", summary));
    }
}
