package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.employeeRequests.EmployeeUpdateRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.employeeResponse.EmployeeResponseWithServices;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.EmployeeService;
import jakarta.validation.Valid;
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
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping("/partnerUser/registerEmployee/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerEmployee(
            @Valid @RequestBody EmployeeRegisterRequest dto,
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        employeeService.saveEmployee(dto, propertyId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Employee added successfully"));
    }

    @GetMapping("/partnerUser/getEmployeesWithServices/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmployeesWithServices(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        List<EmployeeResponseWithServices> employees = employeeService.getAllEmployeesWithServices(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("allEmployeeDetails", employees);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PatchMapping("/partnerUser/updateEmployee/{propertyId}/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateEmployee(
            @Valid @RequestBody EmployeeUpdateRequest dto,
            @PathVariable Long propertyId,
            @PathVariable Long employeeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        employeeService.updateEmployee(dto, employeeId, propertyId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Employee updated successfully"));
    }

    @DeleteMapping("/partnerUser/deleteEmployee/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteEmployee(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        employeeService.deleteEmployeeById(employeeId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Employee deleted successfully"));
    }

    @PutMapping("/partnerUser/addServicesToEmployee/{employeeId}/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addServicesToEmployee(
            @PathVariable Long employeeId,
            @PathVariable Long propertyId,
            @RequestBody List<Long> serviceIds,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        employeeService.addServicesToEmployee(employeeId, serviceIds, propertyId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Services added to employee"));
    }

    @DeleteMapping("/partnerUser/removeServiceFromEmployee/{propertyId}/{employeeId}/{serviceId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeServiceFromEmployee(
            @PathVariable Long propertyId,
            @PathVariable Long employeeId,
            @PathVariable Long serviceId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        employeeService.removeServiceFromEmployee(employeeId, serviceId, propertyId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Service removed from employee"));
    }
}
