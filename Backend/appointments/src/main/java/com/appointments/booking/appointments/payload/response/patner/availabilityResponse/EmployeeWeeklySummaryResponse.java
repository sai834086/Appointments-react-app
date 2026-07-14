package com.appointments.booking.appointments.payload.response.patner.availabilityResponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Compact summary used by the partner Employees grid card.
 * Lists which weekdays are bookable (e.g. ["MONDAY","WEDNESDAY"]) and how many
 * months out the booking window currently extends.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeWeeklySummaryResponse {

    /** Days where the employee's availability row is marked AVAILABILE. */
    private List<String> availableDays;

    /** Booking window length copied from Employee.appointmentsOpenTillInMonths. */
    private Short appointmentsOpenTillInMonths;
}
