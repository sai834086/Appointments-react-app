package com.appointments.booking.appointments.controller.user;

import com.appointments.booking.appointments.payload.request.admin.RegisterRequest;
import com.appointments.booking.appointments.payload.request.support.SupportRegisterRequest;
import com.appointments.booking.appointments.service.user.UserService;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("appointments/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }


    @PostMapping("/create-admin")
    public ResponseEntity<?> createNewAdmin(@RequestBody RegisterRequest request) {
        userService.registerAdmin(request);
        return ResponseEntity.ok("New Admin created successfully.");
    }

    @PostMapping("/create-support")
    public ResponseEntity<?> createSupportUser(@RequestBody SupportRegisterRequest request) {
        userService.registerSupport(request);
        return ResponseEntity.ok("Support user created successfully.");
    }

    @GetMapping("/support-users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportUsers() {
        List<AppUserProfileResponse> users = userService.getSupportUsers();
        Map<String, Object> payload = new HashMap<>();
        payload.put("supportUsers", users);
        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }
}
