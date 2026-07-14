package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.serviceRequest.ServicesDTO;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.serviceResponse.ServicesResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.ServicesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
@PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
public class ServiceController {

    private final ServicesService servicesService;

    public ServiceController(ServicesService servicesService) {
        this.servicesService = servicesService;
    }

    @PostMapping("/partnerUser/addService/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addService(
            @RequestBody ServicesDTO dto,
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        servicesService.addService(dto, propertyId, jwtUserDetails.getId());
        List<ServicesResponse> dtoList = servicesService.getServices(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("services", dtoList);

        return ResponseEntity.ok(new ApiResponse<>(true, "Service added successfully", payload));
    }

    @GetMapping("/partnerUser/getServices/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getService(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        List<ServicesResponse> dtoList = servicesService.getServices(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("services", dtoList);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @DeleteMapping("/partnerUser/deleteService/{propertyId}/{serviceId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteService(
            @PathVariable Long propertyId,
            @PathVariable Long serviceId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        servicesService.deleteService(serviceId, propertyId, jwtUserDetails.getId());
        List<ServicesResponse> dtoList = servicesService.getServices(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("services", dtoList);

        return ResponseEntity.ok(new ApiResponse<>(true, "Service deleted successfully", payload));
    }

    @PatchMapping("/partnerUser/updateService/{propertyId}/{serviceId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateService(
            @RequestBody ServicesDTO dto,
            @PathVariable Long propertyId,
            @PathVariable Long serviceId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        servicesService.updateService(dto, serviceId, jwtUserDetails.getId());
        List<ServicesResponse> dtoList = servicesService.getServices(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("services", dtoList);

        return ResponseEntity.ok(new ApiResponse<>(true, "Service updated successfully", payload));
    }

    @GetMapping("/partnerUser/getServicesToEmployees/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getServicesToEmployee(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        List<ServicesResponse> servicesResponses = servicesService.getEmployeeServices(employeeId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("employeeServices", servicesResponses);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }
}
