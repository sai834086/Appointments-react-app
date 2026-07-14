package com.appointments.booking.appointments.service.user;

import com.appointments.booking.appointments.payload.response.user.BookingsResponse;
import com.appointments.booking.appointments.payload.response.patner.availabilityResponse.AvailabilitySlotsResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.payload.response.user.*;

import java.time.LocalDate;
import java.util.List;

public interface AppUserDataFetchService {

    List<AllPartnerUsersToAppUsers> getAllPartners(String country, String state, String city);

    List<AllPropertiesToAppUsers> getAllProperties(Long partnerId);

    List<EmployeeDTO> getAllEmployees(Long propertyId);

    EmployeeAvailabilityResponse getEmployeeAvailabilityWithEmployeeId(Long employeeId);

    EmployeeResponseWithServices getEmployee(Long employeeId);

    List<PropertiesWithEmployees> getAllPropertiesWithEmployees(Long partnerId);

    List<PropertyWithServicesResponse> getAllServicesByPartner(Long partnerId);

    List<EmployeeDTO> getEmployeesForService(Long propertyId, Long serviceId);

    AvailabilitySlotsResponse getAvailabileSlots(Long serviceId,Long employeeId, LocalDate date);

    List<BookingsResponse> getAllBookings(Long id);

    void cancelBooking(Long apUserId, Long appointmentId);

}
