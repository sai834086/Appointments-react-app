package com.appointments.booking.appointments.payload.response.user;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class EmployeeDTO {

    private Long employeeId;

    private String firstName;

    private String lastName;

    private StatusEnum status;
}
