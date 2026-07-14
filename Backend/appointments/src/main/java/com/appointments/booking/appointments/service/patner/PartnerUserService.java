package com.appointments.booking.appointments.service.patner;

import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUpdateRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUserSignUpRequest;
import com.appointments.booking.appointments.payload.response.patner.partnerResponse.PartnerProfileResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.PropertyDetailsResponse;
import org.springframework.security.core.userdetails.UserDetailsService;


import java.util.List;

public interface PartnerUserService {
    void saveUser(PartnerUserSignUpRequest signUpRequest);

    // Live availability check used by the signup wizard while the user is
    // still typing the business name — mirrors the same uniqueness check
    // saveUser enforces at final submit, just exposed read-only and earlier.
    boolean checkBusinessNameExits(String businessName);
    PartnerProfileResponse partnerUserDetails(String userName);
    boolean userVerified(String userName);
    void updatePartner(Long id, PartnerUpdateRequest request);
    PartnerProfileResponse partnerUserDetails(Long id);

    // Support portal: list every registered partner
    List<PartnerProfileResponse> getAllPartners();

    // Support portal: flip an UNVERIFIED partner to VERIFIED
    PartnerProfileResponse verifyPartner(Long partnerId);

    // ---------------- Email verification (self-serve) ----------------
    // Confirms the token from the emailed link, marks the account's email as
    // verified. Returns the verified account's email so the frontend can
    // show a personalized confirmation.
    String verifyEmail(String token);

    // Re-issues a fresh token and re-sends the verification email. Safe to
    // call repeatedly; silently no-ops (rather than leaking whether an email
    // exists) if the account is not found or already verified.
    void resendVerificationEmail(String email);
}
