package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.dashboardResponse.DashboardStatsResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Partner dashboard hero stats.
     * period = TODAY | MONTH | YEAR (defaults to MONTH when missing/invalid).
     */
    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @GetMapping("partnerUser/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(
            @RequestParam(value = "period", required = false) String period,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        DashboardStatsResponse stats = dashboardService.getStats(jwtUserDetails.getId(), period);

        Map<String, Object> payload = new HashMap<>();
        payload.put("stats", stats);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }
}
