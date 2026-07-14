package com.appointments.booking.appointments.payload.response.patner.employeeResponse;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import lombok.Data;

@Data
public class EmployeeResponse {

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private StatusEnum status;

    private String appointmentsOpenTillInMonths;
}
