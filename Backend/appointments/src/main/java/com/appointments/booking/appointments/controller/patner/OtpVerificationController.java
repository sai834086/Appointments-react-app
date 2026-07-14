package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.SendOtpRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.SendPhoneOtpRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.VerifyOtpRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.VerifyPhoneOtpRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.mail.MailService;
import com.appointments.booking.appointments.service.otp.OtpService;
import com.appointments.booking.appointments.service.otp.PhoneOtpService;
import com.appointments.booking.appointments.service.sms.SmsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Public (no-auth) endpoints backing the "verify your email"/"verify your
 * phone" steps inside the partner signup wizard itself (step 1, before the
 * account exists — see OtpService/PhoneOtpService for how this differs
 * from the post-signup link flow in EmailVerificationController).
 */
@RestController
@RequestMapping("/appointments/auth")
public class OtpVerificationController {

    private final OtpService otpService;
    private final MailService mailService;
    private final PhoneOtpService phoneOtpService;
    private final SmsService smsService;
    private final AppUserRepository appUserRepository;

    public OtpVerificationController(OtpService otpService, MailService mailService,
                                      PhoneOtpService phoneOtpService, SmsService smsService,
                                      AppUserRepository appUserRepository) {
        this.otpService = otpService;
        this.mailService = mailService;
        this.phoneOtpService = phoneOtpService;
        this.smsService = smsService;
        this.appUserRepository = appUserRepository;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        // Reject up front — before spending an OTP send — if this email is
        // already registered as a partner. Mirrors the exact "already a
        // partner" check PartnerUserServiceImpl.saveUser performs at final
        // submission (PARTNER role present, or a PartnerUser profile
        // already linked), so this only blocks what final submit would
        // also reject; a plain existing (non-partner) AppUser is still
        // allowed through, since saveUser upgrades that account instead of
        // rejecting it.
        appUserRepository.findByEmail(request.getEmail()).ifPresent(appUser -> {
            boolean alreadyPartner = appUser.getRoles().stream()
                    .anyMatch(r -> r.getRoleName().equals("PARTNER"));
            if (alreadyPartner || appUser.getPartnerUser() != null) {
                throw new AlreadyExistsException("This email already exists.");
            }
        });

        String code = otpService.issueOtp(request.getEmail());
        mailService.sendOtpEmail(request.getEmail(), code);
        return ResponseEntity.ok(new ApiResponse<>(true, "We've sent a 6-digit code to your email.", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(new ApiResponse<>(true, "Email verified.", null));
    }

    // ----------------------------------------------------------------
    // Phone OTP — same shape as the email flow above, backed by
    // PhoneOtpService/SmsService instead of OtpService/MailService.
    // ----------------------------------------------------------------

    /**
     * Live availability check the signup wizard calls on blur/Next, before
     * the user even asks for a code — mirrors
     * PartnerUserController.checkBusinessNameAvailability.
     */
    @GetMapping("/check-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPhoneAvailability(
            @RequestParam String phoneNumber) {
        boolean exists = appUserRepository.existsByPhoneNumber(phoneNumber);

        Map<String, Object> payload = new HashMap<>();
        payload.put("available", !exists);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    @PostMapping("/send-phone-otp")
    public ResponseEntity<ApiResponse<Void>> sendPhoneOtp(@Valid @RequestBody SendPhoneOtpRequest request) {
        // Same reasoning as sendOtp above — reject before spending a send if
        // this number is already registered to any account, since
        // PartnerUserServiceImpl.saveUser would reject it at final submit
        // anyway (phone_number has a unique constraint on app_user).
        if (appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException("This phone number is already in use.");
        }

        String code = phoneOtpService.issueOtp(request.getPhoneNumber());
        smsService.sendOtpSms(request.getPhoneNumber(), code);
        return ResponseEntity.ok(new ApiResponse<>(true, "We've sent a 6-digit code to your phone.", null));
    }

    @PostMapping("/verify-phone-otp")
    public ResponseEntity<ApiResponse<Void>> verifyPhoneOtp(@Valid @RequestBody VerifyPhoneOtpRequest request) {
        phoneOtpService.verifyOtp(request.getPhoneNumber(), request.getOtp());
        return ResponseEntity.ok(new ApiResponse<>(true, "Phone number verified.", null));
    }
}
