package com.appointments.booking.appointments.payload.response.patner.propertyResponse;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;

import java.util.List;

@Data
public class PropertyDetailsResponse {

        private Long propertyId;

        private String firstName;

        private String lastName;

        private String email;

        private String phoneNumber;

        private String propertyName;

        private String buildingNo;

        private String street;

        private String city;

        private String state;

        private String country;

        @Enumerated(EnumType.STRING)
        private StatusEnum status;

        private String zipCode;

        /** Dedicated manager assigned to this property (if any). */
        private ManagerDetailsResponse manager;

        /** Receptionists assigned to this property (if any). Read-only role. */
        private List<ReceptionistDetailsResponse> receptionists;

        /** Total employees currently attached to this property. */
        private Integer totalEmployees;

        /** Total services currently offered at this property. */
        private Integer totalServices;

        /** Employees with ACTIVE status at this property (inactive = total - active). */
        private Integer activeEmployees;

        /** Services offered by at least one employee here (inactive = total - active). */
        private Integer activeServices;
}
