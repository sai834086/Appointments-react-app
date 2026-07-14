package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUpdateRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUserSignUpRequest;
import com.appointments.booking.appointments.payload.response.patner.partnerResponse.PartnerProfileResponse;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.patner.PartnerUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class PartnerUserController {

    private final PartnerUserService partnerUserService;

    public PartnerUserController(PartnerUserService partnerUserService) {
        this.partnerUserService = partnerUserService;
    }

    @PostMapping("/partnerUser/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> partnerUserSignUp(@Valid @RequestBody PartnerUserSignUpRequest partnerUser) {
        partnerUserService.saveUser(partnerUser);
        return ResponseEntity.ok(new ApiResponse<>(true, "Registration successful"));
    }

    // Public, no-auth: lets the signup wizard check business-name availability
    // live, while the user is still typing, without waiting for final submit.
    @GetMapping("/partnerUser/check-business-name")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkBusinessNameAvailability(
            @RequestParam String businessName) {
        boolean exists = partnerUserService.checkBusinessNameExits(businessName);

        Map<String, Object> payload = new HashMap<>();
        payload.put("available", !exists);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @PatchMapping("/partnerUser/profileUpdate/{partnerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePartner(
            @PathVariable Long partnerId,
            @RequestBody PartnerUpdateRequest request,
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        if (!partnerId.equals(jwtUserDetails.getId())) {
            throw new UnauthorizedAccessOrUnknownException("Unauthorized, no access");
        }
        partnerUserService.updatePartner(jwtUserDetails.getId(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully"));
    }

    @PreAuthorize("hasAnyRole('PARTNER','MANAGER')")
    @GetMapping("/partnerUser/getPartnerProfile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPartnerProfile(@AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        PartnerProfileResponse partnerProfile = partnerUserService.partnerUserDetails(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerUserProfile", partnerProfile);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }
}
