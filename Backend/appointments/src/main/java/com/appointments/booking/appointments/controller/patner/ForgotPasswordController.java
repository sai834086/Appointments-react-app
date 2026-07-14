package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.ResetPasswordRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.SendOtpRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.VerifyOtpRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.mail.MailService;
import com.appointments.booking.appointments.service.otp.OtpService;
import com.appointments.booking.appointments.service.otp.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Partner "forgot password" — three steps, each its own request so the
 * frontend never has to hold the actual new password anywhere except the
 * final call: (1) email -> send a 6-digit code (reuses OtpService/
 * MailService, same as everywhere else in the app), (2) email + code ->
 * verify it and get back a short-lived reset token (PasswordResetService),
 * (3) reset token + new password -> update the account and the user can log
 * in normally afterward.
 */
@RestController
@RequestMapping("/appointments/partnerUser/forgot-password")
public class ForgotPasswordController {

    private final AppUserRepository appUserRepository;
    private final OtpService otpService;
    private final MailService mailService;
    private final PasswordResetService passwordResetService;
    private final PasswordEncoder passwordEncoder;

    public ForgotPasswordController(AppUserRepository appUserRepository,
                                     OtpService otpService,
                                     MailService mailService,
                                     PasswordResetService passwordResetService,
                                     PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.otpService = otpService;
        this.mailService = mailService;
        this.passwordResetService = passwordResetService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        requirePartnerOrManagerAccount(request.getEmail());

        String code = otpService.issueOtp(request.getEmail());
        mailService.sendOtpEmail(request.getEmail(), code);
        return ResponseEntity.ok(new ApiResponse<>(true, "We've sent a 6-digit code to your email.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        requirePartnerOrManagerAccount(request.getEmail());

        otpService.verifyOtp(request.getEmail(), request.getOtp());
        otpService.consume(request.getEmail());

        String resetToken = passwordResetService.issueResetToken(request.getEmail());

        Map<String, Object> payload = new HashMap<>();
        payload.put("resetToken", resetToken);
        return ResponseEntity.ok(new ApiResponse<>(true, "Code verified.", payload));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidException("Passwords do not match.");
        }

        String email = passwordResetService.resolveEmail(request.getResetToken());
        AppUser appUser = requirePartnerOrManagerAccount(email);

        appUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(appUser);

        passwordResetService.consume(request.getResetToken());

        return ResponseEntity.ok(new ApiResponse<>(
                true, "Your password has been updated. You can now sign in.", null));
    }

    /**
     * The flow serves both partner owners and property managers: managers'
     * accounts are created by the partner with an auto-generated password,
     * so this reset flow IS their first-login password setup (the invite
     * email links straight into it).
     */
    private AppUser requirePartnerOrManagerAccount(String email) {
        AppUser appUser = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("No account found with that email."));

        boolean isPartner = appUser.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().equals("PARTNER"))
                && appUser.getPartnerUser() != null;
        boolean isManager = appUser.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equals("MANAGER"));

        if (!isPartner && !isManager) {
            throw new UnauthorizedAccessOrUnknownException("No account found with that email.");
        }
        return appUser;
    }
}
