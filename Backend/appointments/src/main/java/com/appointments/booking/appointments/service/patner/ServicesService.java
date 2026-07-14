package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.request.patner.serviceRequest.ServicesDTO;
import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;

import java.util.List;
import java.util.Map;

public interface ServicesService {

    void addService(ServicesDTO dto, Long propertyId, Long partnerId);

    void deleteService(Long serviceId,Long propertyId, Long partnerId);

    void updateService(ServicesDTO dto, Long serviceId, Long partnerId);

    List<ServicesResponse> getEmployeeServices(Long employeeId, Long partnerId);

   List<ServicesResponse> getServices(Long propertyId, Long partnerId);
}
