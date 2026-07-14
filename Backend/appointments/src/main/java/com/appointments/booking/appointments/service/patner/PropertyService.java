package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ManagerRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ReceptionistRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ManagerDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ReceptionistDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.PropertyDetailsResponse;

import java.util.List;

public interface PropertyService {
    void addProperty(PropertyRegisterRequest dto, Long partnerId);
    List<PropertyDetailsResponse> allPropertyDetails(Long partnerId);
    PropertyDetailsResponse updateProperty(PropertyUpdateRequest dto,Long id, Long partnerId);

    // ----- Manager operations for a property -----
    ManagerDetailsResponse getManager(Long propertyId, Long userId);
    ManagerDetailsResponse addManager(Long propertyId, ManagerRequest request, Long userId);
    ManagerDetailsResponse updateManager(Long propertyId, ManagerRequest request, Long userId);

    /**
     * Detach the dedicated manager from a property. Leaves the underlying
     * AppUser intact so they can still log in or be reassigned elsewhere.
     */
    void removeManager(Long propertyId, Long userId);

    // ----- Receptionist operations for a property -----
    // A property may have any number of receptionists, so list/update/remove
    // are all scoped by receptionistId (the receptionist AppUser's userId) in
    // addition to propertyId.
    List<ReceptionistDetailsResponse> getReceptionists(Long propertyId, Long userId);
    ReceptionistDetailsResponse addReceptionist(Long propertyId, ReceptionistRequest request, Long userId);
    ReceptionistDetailsResponse updateReceptionist(Long propertyId, Long receptionistId, ReceptionistRequest request, Long userId);

    /**
     * Detach one receptionist from a property. Leaves the underlying AppUser
     * intact so they can still log in or be reassigned elsewhere.
     */
    void removeReceptionist(Long propertyId, Long receptionistId, Long userId);
}
