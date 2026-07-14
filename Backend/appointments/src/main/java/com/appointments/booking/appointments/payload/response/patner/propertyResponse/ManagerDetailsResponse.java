package com.appointments.booking.appointments.payload.response.patner.propertyResponse;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Response payload representing the manager assigned to a property.
 *
 * NOTE: The 'isOwner' flag is true when the property's manager is the
 * partner / owner themselves (i.e. no dedicated manager has been assigned).
 * Frontend uses this flag to decide between "Add Manager" vs "Edit Manager".
 */
@Data
public class ManagerDetailsResponse {

    private Long userId;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    // Force the JSON key to be "isOwner" so the frontend can read it
    // unambiguously regardless of Jackson's default boolean naming.
    @JsonProperty("isOwner")
    private boolean isOwner;
}
