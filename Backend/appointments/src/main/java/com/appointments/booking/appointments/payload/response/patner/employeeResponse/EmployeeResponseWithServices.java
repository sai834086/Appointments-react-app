package com.appointments.booking.appointments.payload.response.patner.employeeResponse;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;
import lombok.Data;

import java.util.List;

@Data
public class EmployeeResponseWithServices {
    private String employeeId;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private StatusEnum status;

    private String appointmentsOpenTillInMonths;

    private List<ServicesResponse> servicesList;
}
