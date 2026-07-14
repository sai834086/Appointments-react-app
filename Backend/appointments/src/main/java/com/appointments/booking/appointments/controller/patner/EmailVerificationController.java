package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.payload.request.patner.partnerRequests.ResendVerificationRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.service.patner.PartnerUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Public (no-auth) endpoints for the self-serve "verify your email" flow
 * that runs after partner signup. Kept separate from PartnerUserController
 * since these are unauthenticated and semantically about proving email
 * ownership, not about the partner profile itself.
 */
@RestController
@RequestMapping("/appointments/auth")
public class EmailVerificationController {

    private final PartnerUserService partnerUserService;

    public EmailVerificationController(PartnerUserService partnerUserService) {
        this.partnerUserService = partnerUserService;
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyEmail(@RequestParam String token) {
        String email = partnerUserService.verifyEmail(token);

        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Email verified successfully", payload));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        partnerUserService.resendVerificationEmail(request.getEmail());
        // Always the same generic message, regardless of whether the email
        // exists or is already verified — avoids leaking account existence.
        return ResponseEntity.ok(new ApiResponse<>(
                true, "If that email exists and isn't verified yet, we've sent a new link.", null));
    }
}
