package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.response.patner.dashboardResponse.DashboardStatsResponse;

public interface DashboardService {

    /**
     * Aggregate counters shown on the partner dashboard hero.
     *
     * @param userId AppUser id of the logged-in partner (from JwtUserDetails)
     * @param period one of TODAY, MONTH, YEAR — controls the date range used
     *               for the totalAppointments count. Null defaults to MONTH.
     */
    DashboardStatsResponse getStats(Long userId, String period);
}
