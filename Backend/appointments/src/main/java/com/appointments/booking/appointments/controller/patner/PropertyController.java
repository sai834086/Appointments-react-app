package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ManagerRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ReceptionistRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyUpdateRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ManagerDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ReceptionistDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.PropertyDetailsResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.PropertyService;
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
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PreAuthorize("hasRole('PARTNER')")
    @PostMapping("partnerUser/registerProperty")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerProperty(
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails,
            @Valid @RequestBody PropertyRegisterRequest dto) {
        propertyService.addProperty(dto, jwtUserDetails.getId());
        List<PropertyDetailsResponse> allPropertyDetails = propertyService.allPropertyDetails(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerAllProperties", allPropertyDetails);

        return ResponseEntity.ok(new ApiResponse<>(true, "Property added successfully", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @PatchMapping("partnerUser/updateProperty/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProperty(
            @PathVariable Long propertyId,
            @Valid @RequestBody PropertyUpdateRequest dto,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        PropertyDetailsResponse propertyDetails = propertyService.updateProperty(dto, propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("propertyDetails", propertyDetails);

        return ResponseEntity.ok(new ApiResponse<>(true, "Property updated successfully", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @GetMapping("partnerUser/getAllProperties")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllProperties(@AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        List<PropertyDetailsResponse> allPropertyDetails = propertyService.allPropertyDetails(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerAllProperties", allPropertyDetails);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    // ----------------------------------------------------------------
    // MANAGER ENDPOINTS
    // ----------------------------------------------------------------

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @GetMapping("partnerUser/getManager/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getManager(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        ManagerDetailsResponse manager = propertyService.getManager(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("manager", manager);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PreAuthorize("hasRole('PARTNER')")
    @PostMapping("partnerUser/addManager/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addManager(
            @PathVariable Long propertyId,
            @Valid @RequestBody ManagerRequest request,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        ManagerDetailsResponse manager = propertyService.addManager(propertyId, request, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("manager", manager);

        return ResponseEntity.ok(new ApiResponse<>(true, "Manager added successfully", payload));
    }

    @PreAuthorize("hasRole('PARTNER')")
    @PatchMapping("partnerUser/updateManager/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateManager(
            @PathVariable Long propertyId,
            @Valid @RequestBody ManagerRequest request,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        ManagerDetailsResponse manager = propertyService.updateManager(propertyId, request, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("manager", manager);

        return ResponseEntity.ok(new ApiResponse<>(true, "Manager updated successfully", payload));
    }

    @PreAuthorize("hasRole('PARTNER')")
    @DeleteMapping("partnerUser/removeManager/{propertyId}")
    public ResponseEntity<ApiResponse<Void>> removeManager(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        propertyService.removeManager(propertyId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Manager removed successfully"));
    }

    // ----------------------------------------------------------------
    // RECEPTIONIST ENDPOINTS
    // ----------------------------------------------------------------

    // A property may have any number of receptionists, so this returns a
    // list and update/remove take a receptionistId path segment identifying
    // which one.

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @GetMapping("partnerUser/getReceptionists/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReceptionists(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        List<ReceptionistDetailsResponse> receptionists = propertyService.getReceptionists(propertyId, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("receptionists", receptionists);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @PostMapping("partnerUser/addReceptionist/{propertyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addReceptionist(
            @PathVariable Long propertyId,
            @Valid @RequestBody ReceptionistRequest request,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        ReceptionistDetailsResponse receptionist = propertyService.addReceptionist(propertyId, request, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("receptionist", receptionist);

        return ResponseEntity.ok(new ApiResponse<>(true, "Receptionist added successfully", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @PatchMapping("partnerUser/updateReceptionist/{propertyId}/{receptionistId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateReceptionist(
            @PathVariable Long propertyId,
            @PathVariable Long receptionistId,
            @Valid @RequestBody ReceptionistRequest request,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        ReceptionistDetailsResponse receptionist = propertyService.updateReceptionist(propertyId, receptionistId, request, jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("receptionist", receptionist);

        return ResponseEntity.ok(new ApiResponse<>(true, "Receptionist updated successfully", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @DeleteMapping("partnerUser/removeReceptionist/{propertyId}/{receptionistId}")
    public ResponseEntity<ApiResponse<Void>> removeReceptionist(
            @PathVariable Long propertyId,
            @PathVariable Long receptionistId,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        propertyService.removeReceptionist(propertyId, receptionistId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Receptionist removed successfully"));
    }
}
