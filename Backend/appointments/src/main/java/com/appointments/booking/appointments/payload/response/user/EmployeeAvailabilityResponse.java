package com.appointments.booking.appointments.payload.response.user;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EmployeeAvailabilityResponse {

    private Long employeeId;

    private String employeeName;

    private short appointmentsOpenTillInMonths;

    private List<String> availableDays;



}
