package com.appointments.booking.appointments.controller.patner;

import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUserLoginRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.VerifyLoginOtpRequest;
import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.security.JwtUtil;
import com.appointments.booking.appointments.service.mail.MailService;
import com.appointments.booking.appointments.service.otp.OtpService;
import com.appointments.booking.appointments.service.otp.PhoneOtpService;
import com.appointments.booking.appointments.service.patner.PartnerUserService;
import com.appointments.booking.appointments.service.sms.SmsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class LoginController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;
    private final PartnerUserService partnerUserService;
    private final OtpService otpService;
    private final PhoneOtpService phoneOtpService;
    private final MailService mailService;
    private final SmsService smsService;
    private final UserDetailsService userDetailsService;
    private final SecureRandom random = new SecureRandom();

    public LoginController(AuthenticationManager authenticationManager,
                           JwtUtil jwtUtil,
                           AppUserRepository appUserRepository,
                           PartnerUserService partnerUserService,
                           OtpService otpService,
                           PhoneOtpService phoneOtpService,
                           MailService mailService,
                           SmsService smsService,
                           UserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.appUserRepository = appUserRepository;
        this.partnerUserService = partnerUserService;
        this.otpService = otpService;
        this.phoneOtpService = phoneOtpService;
        this.mailService = mailService;
        this.smsService = smsService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Step 1 of login: validate email/phone + password as before, but
     * instead of returning a JWT immediately, mint a single 6-digit code and
     * deliver it over BOTH channels (email and SMS) — the same code either
     * way, so whichever one the user actually reads works. No token is
     * issued until that code comes back correct via {@link #verifyLoginOtp}.
     */
    @PostMapping("/partnerUser/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> partnerUserLogin(@Valid @RequestBody PartnerUserLoginRequest partnerDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(partnerDTO.getUserName(), partnerDTO.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // loadUserByUsername returns raw role names (e.g. "PARTNER"), no ROLE_ prefix
        boolean roleMatches = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals(partnerDTO.getRole()));

        if (!roleMatches) {
            throw new InvalidException("You don't have access with role: " + partnerDTO.getRole());
        }

        // Look up by email OR phone — partnerDTO.getUserName() may be either,
        // since the login form accepts both.
        AppUser appUser = appUserRepository.findByEmailOrPhoneNumber(partnerDTO.getUserName(), partnerDTO.getUserName())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        // Email verification (self-serve, proves they own the address) is
        // checked before business verification (manual, staff-reviewed) —
        // it's the earlier step in the funnel and gets a distinct message
        // so the frontend can offer a "Resend verification email" action.
        if (!appUser.isEmailVerified()) {
            throw new InvalidException(
                    "Please verify your email address before signing in. Check your inbox for the verification link.");
        }

        if (!partnerUserService.userVerified(appUser.getEmail())) {
            throw new InvalidException("Account verification is in progress.");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        otpService.issueOtpWithCode(appUser.getEmail(), code);
        phoneOtpService.issueOtpWithCode(appUser.getPhoneNumber(), code);
        mailService.sendOtpEmail(appUser.getEmail(), code);
        smsService.sendOtpSms(appUser.getPhoneNumber(), code);

        Map<String, Object> payload = new HashMap<>();
        payload.put("requiresOtp", true);
        payload.put("email", appUser.getEmail());
        payload.put("phoneNumber", appUser.getPhoneNumber());
        payload.put("role", partnerDTO.getRole());

        return ResponseEntity.ok(new ApiResponse<>(
                true, "We've sent a 6-digit code to your email and phone number.", payload));
    }

    /**
     * Step 2 of login: the code from either channel completes sign-in and
     * mints the JWT. Password was already validated in step 1 — this only
     * re-checks the OTP and the same account-status gates, since the two
     * requests aren't otherwise linked (no server-side session between them).
     */
    @PostMapping("/partnerUser/login/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyLoginOtp(@Valid @RequestBody VerifyLoginOtpRequest request) {
        AppUser appUser = appUserRepository.findByEmailOrPhoneNumber(request.getUserName(), request.getUserName())
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        if (!appUser.isEmailVerified()) {
            throw new InvalidException(
                    "Please verify your email address before signing in. Check your inbox for the verification link.");
        }

        if (!partnerUserService.userVerified(appUser.getEmail())) {
            throw new InvalidException("Account verification is in progress.");
        }

        verifyEitherChannel(appUser, request.getOtp());

        UserDetails userDetails = userDetailsService.loadUserByUsername(appUser.getEmail());

        boolean roleMatches = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("PARTNER"));
        if (!roleMatches) {
            throw new InvalidException("You don't have access with role: PARTNER");
        }

        String jwt = jwtUtil.generateToken(userDetails, appUser.getUserId());

        // Consume both stores regardless of which one the matching code came
        // from, so neither can be replayed.
        otpService.consume(appUser.getEmail());
        phoneOtpService.consume(appUser.getPhoneNumber());

        Map<String, Object> payload = new HashMap<>();
        payload.put("token", jwt);
        payload.put("type", "Bearer");
        payload.put("role", "PARTNER");
        payload.put("username", userDetails.getUsername());
        payload.put("userId", appUser.getUserId());
        payload.put("firstName", appUser.getFirstName());
        payload.put("lastName", appUser.getLastName());

        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", payload));
    }

    /** Tries the email OTP store first, then the phone one — same code was sent to both. */
    private void verifyEitherChannel(AppUser appUser, String otp) {
        try {
            otpService.verifyOtp(appUser.getEmail(), otp);
            return;
        } catch (InvalidException emailFailure) {
            try {
                phoneOtpService.verifyOtp(appUser.getPhoneNumber(), otp);
            } catch (InvalidException phoneFailure) {
                // Neither channel matched — surface the email-channel message,
                // since that's the one most partners will act on.
                throw emailFailure;
            }
        }
    }
}
