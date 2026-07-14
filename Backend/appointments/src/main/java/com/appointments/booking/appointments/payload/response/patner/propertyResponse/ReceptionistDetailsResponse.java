package com.appointments.booking.appointments.payload.response.patner.propertyResponse;

import lombok.Data;

/**
 * Response payload representing the receptionist assigned to a property.
 * Receptionists are a read-only role — they can only view a property's
 * appointments, nothing else (see AppointmentController's authorization
 * check).
 */
@Data
public class ReceptionistDetailsResponse {

    private Long userId;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;
}
