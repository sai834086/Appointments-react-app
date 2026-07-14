package com.appointments.booking.appointments.controller.receptionist;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.payload.request.receptionist.ReceptionistLoginRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Dedicated login endpoint for property receptionists.
 *
 * Receptionists are AppUsers with the RECEPTIONIST role assigned by the
 * partner via {@code partnerUser/addReceptionist/{propertyId}}. They are NOT
 * PartnerUser accounts, so the existing /partnerUser/login flow (which
 * requires a verified PartnerUser association) cannot be reused as-is.
 * Mirrors ManagerLoginController — see there for the full flow rationale.
 *
 * Receptionists are strictly read-only: their assigned property's
 * appointments, nothing else.
 */
@RestController
@RequestMapping("/appointments")
public class ReceptionistLoginController {

    private static final String ROLE_RECEPTIONIST = "RECEPTIONIST";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;

    public ReceptionistLoginController(AuthenticationManager authenticationManager,
                                        JwtUtil jwtUtil,
                                        AppUserRepository appUserRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.appUserRepository = appUserRepository;
    }

    @PostMapping("/receptionist/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody ReceptionistLoginRequest request) {

        // 1. Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUserName(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 2. Require RECEPTIONIST role.
        boolean isReceptionist = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ROLE_RECEPTIONIST::equals);

        if (!isReceptionist) {
            throw new UnauthorizedAccessOrUnknownException(
                    "Access denied: this account is not a receptionist.");
        }

        // 3. Resolve the AppUser (username is email-or-phone in this codebase)
        AppUser appUser = appUserRepository
                .findByEmailOrPhoneNumber(request.getUserName(), request.getUserName())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Receptionist account not found."));

        // 4. Issue JWT
        String jwt = jwtUtil.generateToken(userDetails, appUser.getUserId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("token", jwt);
        payload.put("type", "Bearer");
        payload.put("role", ROLE_RECEPTIONIST);
        payload.put("username", userDetails.getUsername());
        payload.put("receptionistProfile", buildReceptionistProfile(appUser));

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", payload));
    }

    /**
     * Returns the currently authenticated receptionist's profile and the
     * property they are assigned to. The SPA calls this on page refresh so
     * the receptionist doesn't have to re-enter credentials to rebuild
     * context.
     */
    @PreAuthorize("hasRole('RECEPTIONIST')")
    @GetMapping("/receptionist/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(
            @AuthenticationPrincipal JwtUserDetails principal) {

        if (principal == null || principal.getId() == null) {
            throw new UnauthorizedAccessOrUnknownException("Not authenticated as receptionist.");
        }

        AppUser appUser = appUserRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Receptionist account not found."));

        Map<String, Object> payload = new HashMap<>();
        payload.put("receptionistProfile", buildReceptionistProfile(appUser));

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    // ----------------------------------------------------------------
    // Helper: shared shape used by /login and /profile so the SPA can
    // treat both responses uniformly.
    // ----------------------------------------------------------------
    private Map<String, Object> buildReceptionistProfile(AppUser appUser) {
        Map<String, Object> receptionistProfile = new LinkedHashMap<>();
        receptionistProfile.put("userId", appUser.getUserId());
        receptionistProfile.put("firstName", appUser.getFirstName());
        receptionistProfile.put("lastName", appUser.getLastName());
        receptionistProfile.put("email", appUser.getEmail());
        receptionistProfile.put("phoneNumber", appUser.getPhoneNumber());
        receptionistProfile.put("role", ROLE_RECEPTIONIST);

        // The FK lives on AppUser.receptionistProperty now (a property can
        // have many receptionists), so this is a direct field read rather
        // than a repository query.
        Optional<Property> assigned = Optional.ofNullable(appUser.getReceptionistProperty());
        assigned.ifPresent(p -> {
            Map<String, Object> property = new LinkedHashMap<>();
            property.put("propertyId", p.getPropertyId());
            property.put("propertyName", p.getPropertyName());
            property.put("buildingNo", p.getBuildingNo());
            property.put("street", p.getStreet());
            property.put("city", p.getCity());
            property.put("state", p.getState());
            property.put("country", p.getCountry());
            property.put("zipCode", p.getZipCode());
            property.put("status", p.getStatus() != null ? p.getStatus().name() : null);
            receptionistProfile.put("property", property);
        });

        return receptionistProfile;
    }
}
