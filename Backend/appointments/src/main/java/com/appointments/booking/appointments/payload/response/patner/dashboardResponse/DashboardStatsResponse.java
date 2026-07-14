package com.appointments.booking.appointments.payload.response.patner.dashboardResponse;

import lombok.Data;

/**
 * Aggregate stats returned to the partner dashboard hero widget.
 *
 * The 'period' reflects which date window the totalAppointments count
 * represents: one of "TODAY", "MONTH", or "YEAR".
 */
@Data
public class DashboardStatsResponse {

    // Welcome
    private String firstName;
    private String businessName;

    // Appointments are date-filtered
    private String period;              // "TODAY" | "MONTH" | "YEAR"
    private long totalAppointments;
    // Same window, broken down by appointment status.
    private long bookedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;

    // Totals across the partner's entire portfolio
    private long totalProperties;
    private long totalEmployees;
    private long totalServices;

    // Status breakdowns for the dashboard overview panel.
    private long activeProperties;
    private long inactiveProperties;
    private long activeEmployees;
    private long inactiveEmployees;
    // A service is ACTIVE when at least one employee offers it.
    private long activeServices;
    private long inactiveServices;
}
