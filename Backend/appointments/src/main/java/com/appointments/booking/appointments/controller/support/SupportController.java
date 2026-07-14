package com.appointments.booking.appointments.controller.support;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.request.support.SupportLoginRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.patner.partnerResponse.PartnerProfileResponse;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import com.appointments.booking.appointments.payload.response.user.BookingsResponse;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.security.JwtUtil;
import com.appointments.booking.appointments.service.patner.PartnerUserService;
import com.appointments.booking.appointments.service.user.AppUserDataFetchService;
import com.appointments.booking.appointments.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments/support")
public class SupportController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;
    private final UserService userService;
    private final AppUserDataFetchService appUserDataFetchService;
    private final PartnerUserService partnerUserService;

    public SupportController(AuthenticationManager authenticationManager,
                             JwtUtil jwtUtil,
                             AppUserRepository appUserRepository,
                             UserService userService,
                             AppUserDataFetchService appUserDataFetchService,
                             PartnerUserService partnerUserService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.appUserRepository = appUserRepository;
        this.userService = userService;
        this.appUserDataFetchService = appUserDataFetchService;
        this.partnerUserService = partnerUserService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody SupportLoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUserName(), loginRequest.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // loadUserByUsername returns raw role names (e.g. "SUPPORT"), no ROLE_ prefix
        boolean isSupport = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("SUPPORT"));

        if (!isSupport) {
            throw new UnauthorizedAccessOrUnknownException("Access denied: not a support account");
        }

        AppUser appUser = appUserRepository.findByEmail(loginRequest.getUserName())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        String jwt = jwtUtil.generateToken(userDetails, appUser.getUserId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("token", jwt);
        payload.put("userId", appUser.getUserId());
        payload.put("firstName", appUser.getFirstName());
        payload.put("lastName", appUser.getLastName());

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", payload));
    }

    @PreAuthorize("hasRole('SUPPORT')")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllUsers() {
        List<AppUserProfileResponse> users = userService.getAllAppUsers();

        Map<String, Object> payload = new HashMap<>();
        payload.put("users", users);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PreAuthorize("hasRole('SUPPORT')")
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetail(@PathVariable Long userId) {
        AppUserProfileResponse profile = userService.getUserDetails(userId);
        List<BookingsResponse> bookings = appUserDataFetchService.getAllBookings(userId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("user", profile);
        payload.put("bookings", bookings);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    // ------------------------------------------------------------------
    // PARTNERS — list every partner + let support verify unverified ones
    // ------------------------------------------------------------------

    @PreAuthorize("hasRole('SUPPORT')")
    @GetMapping("/partners")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPartners() {
        List<PartnerProfileResponse> partners = partnerUserService.getAllPartners();

        Map<String, Object> payload = new HashMap<>();
        payload.put("partners", partners);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PreAuthorize("hasRole('SUPPORT')")
    @PatchMapping("/partners/{partnerId}/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPartner(@PathVariable Long partnerId) {
        PartnerProfileResponse updated = partnerUserService.verifyPartner(partnerId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("partner", updated);

        return ResponseEntity.ok(new ApiResponse<>(true, "Partner verified successfully", payload));
    }
}
