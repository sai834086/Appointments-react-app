package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.offTimeRequest.OffTimeRegisterRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.offTimeResponse.GetAllOffTimeResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.OffTimeService;
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
public class OffTimeController {

    private final OffTimeService offTimeService;

    public OffTimeController(OffTimeService offTimeService) {
        this.offTimeService = offTimeService;
    }

    @PostMapping("/partnerUser/offTimeRequest/{availabilityId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addOffTimeRequest(
            @RequestBody OffTimeRegisterRequest dto,
            @PathVariable Long availabilityId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        offTimeService.registerOffTimeRequest(dto, jwtUserDetails.getId(), availabilityId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Off time added successfully"));
    }

    @GetMapping("/partnerUser/getAllOffTime/{availabilityId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllOffTime(
            @PathVariable Long availabilityId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        List<GetAllOffTimeResponse> offTimes = offTimeService.getAllOffTime(availabilityId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("offTimes", offTimes);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @DeleteMapping("/partnerUser/deleteOffTime/{offTimeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteOffTimeById(
            @PathVariable Long offTimeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        offTimeService.deleteOffTime(jwtUserDetails.getId(), offTimeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Off time deleted successfully"));
    }
}
