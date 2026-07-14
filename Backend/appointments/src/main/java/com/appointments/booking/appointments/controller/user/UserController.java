package com.appointments.booking.appointments.controller.user;

import com.appointments.booking.appointments.payload.request.user.UserLoginRequest;
import com.appointments.booking.appointments.payload.request.user.UserSignUpRequest;
import com.appointments.booking.appointments.payload.request.user.UserUpdateRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.security.JwtUtil;
import com.appointments.booking.appointments.service.user.UserService;
import com.appointments.booking.appointments.exception.InvalidException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class UserController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserController(AuthenticationManager authenticationManager, UserService userService, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/registerUser")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveUserRequest(@Valid @RequestBody UserSignUpRequest userDTO) {
        userService.saveUser(userDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Sign up successful"));
    }

    @PostMapping("appUser/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> loginUserRequest(@Valid @RequestBody UserLoginRequest userDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userDTO.getUserName(), userDTO.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // This endpoint serves both regular users (ROLE_USER) and admins
        // (ROLE_ADMIN). The admin frontend intentionally posts here and then
        // verifies ADMIN on the decoded JWT client-side (see AdminLogin.jsx).
        // Partner / Support accounts must use their own login endpoints.
        boolean isAllowed = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("USER") || auth.equals("ADMIN"));

        if (!isAllowed) {
            throw new InvalidException("Access denied: not a user account");
        }

        Long id = userService.getAppUserId(userDTO.getUserName());
        String jwt = jwtUtil.generateToken(userDetails, id);

        Map<String, Object> payload = new HashMap<>();
        payload.put("token", jwt);
        payload.put("userId", id);

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", payload));
    }

    // Scoped to caller's JWT identity — authentication alone is sufficient
    @GetMapping("/appUser/userDetails")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@AuthenticationPrincipal JwtUserDetails jwtUserDetails) {
        AppUserProfileResponse appUserDetails = userService.getUserDetails(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("profile", appUserDetails);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PatchMapping("/appUser/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal JwtUserDetails userDetails) {
        userService.updateUserDetails(userDetails.getId(), request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully"));
    }
}
