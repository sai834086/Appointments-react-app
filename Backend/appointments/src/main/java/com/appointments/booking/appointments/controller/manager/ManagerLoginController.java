package com.appointments.booking.appointments.controller.manager;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.payload.request.manager.ManagerLoginRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
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
 * Dedicated login endpoint for property managers.
 *
 * Managers are AppUsers with the MANAGER role assigned by the partner via
 * {@code PartnerUser/addManager/{propertyId}}. They are NOT PartnerUser
 * accounts, so the existing /partnerUser/login flow (which requires a
 * verified PartnerUser association) cannot be reused as-is.
 *
 * Flow:
 *   1. authenticate(username, password) via Spring's AuthenticationManager
 *   2. require MANAGER role on the authenticated principal
 *   3. look up the AppUser and (if present) the Property they manage
 *   4. issue a JWT and return a small managerProfile payload for the SPA
 */
@RestController
@RequestMapping("/appointments")
public class ManagerLoginController {

    private static final String ROLE_MANAGER = "MANAGER";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;
    private final PropertyRepository propertyRepository;

    public ManagerLoginController(AuthenticationManager authenticationManager,
                                  JwtUtil jwtUtil,
                                  AppUserRepository appUserRepository,
                                  PropertyRepository propertyRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.appUserRepository = appUserRepository;
        this.propertyRepository = propertyRepository;
    }

    @PostMapping("/manager/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody ManagerLoginRequest request) {

        // 1. Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUserName(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 2. Require MANAGER role. loadUserByUsername stores raw role names
        // (e.g. "MANAGER") with no ROLE_ prefix, so we compare against the
        // raw authority string returned by getAuthority().
        boolean isManager = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ROLE_MANAGER::equals);

        if (!isManager) {
            throw new UnauthorizedAccessOrUnknownException(
                    "Access denied: this account is not a manager.");
        }

        // 3. Resolve the AppUser (username is email-or-phone in this codebase)
        AppUser appUser = appUserRepository
                .findByEmailOrPhoneNumber(request.getUserName(), request.getUserName())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Manager account not found."));

        // 4. Issue JWT
        String jwt = jwtUtil.generateToken(userDetails, appUser.getUserId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("token", jwt);
        payload.put("type", "Bearer");
        payload.put("role", ROLE_MANAGER);
        payload.put("username", userDetails.getUsername());
        payload.put("managerProfile", buildManagerProfile(appUser));

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", payload));
    }

    /**
     * Returns the currently authenticated manager's profile and the property
     * they are assigned to. The SPA calls this on page refresh so the manager
     * doesn't have to re-enter credentials to rebuild context.
     */
    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/manager/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(
            @AuthenticationPrincipal JwtUserDetails principal) {

        if (principal == null || principal.getId() == null) {
            throw new UnauthorizedAccessOrUnknownException("Not authenticated as manager.");
        }

        AppUser appUser = appUserRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Manager account not found."));

        Map<String, Object> payload = new HashMap<>();
        payload.put("managerProfile", buildManagerProfile(appUser));

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    // ----------------------------------------------------------------
    // Helper: shared shape used by /login and /profile so the SPA can
    // treat both responses uniformly.
    // ----------------------------------------------------------------
    private Map<String, Object> buildManagerProfile(AppUser appUser) {
        Map<String, Object> managerProfile = new LinkedHashMap<>();
        managerProfile.put("userId", appUser.getUserId());
        managerProfile.put("firstName", appUser.getFirstName());
        managerProfile.put("lastName", appUser.getLastName());
        managerProfile.put("email", appUser.getEmail());
        managerProfile.put("phoneNumber", appUser.getPhoneNumber());
        managerProfile.put("role", ROLE_MANAGER);

        Optional<Property> assigned = propertyRepository.findByManager_UserId(appUser.getUserId());
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
            managerProfile.put("property", property);
        });

        return managerProfile;
    }
}
