package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.PartnerUserMapStruct;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.enums.VerificationEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.roles.Role;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUpdateRequest;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUserSignUpRequest;
import com.appointments.booking.appointments.payload.response.patner.partnerResponse.PartnerProfileResponse;
import com.appointments.booking.appointments.repository.patner.PartnerUserRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.roles.RoleRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.mail.MailService;
import com.appointments.booking.appointments.service.otp.OtpService;
import com.appointments.booking.appointments.service.otp.PhoneOtpService;
import com.appointments.booking.appointments.service.patner.PartnerUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Qualifier("partnerAuthentication")
public class PartnerUserServiceImpl implements PartnerUserService {

    private final PasswordEncoder passwordEncoder;
    private final PartnerUserRepository partnerUserRepository;
    private final PartnerUserMapStruct partnerUserMapStruct;
    private final RoleRepository roleRepository;
    private final PropertyRepository propertyRepository;
    private final AppUserRepository appUserRepository;
    private final MailService mailService;
    private final OtpService otpService;
    private final PhoneOtpService phoneOtpService;

    // Verification links are valid for 24 hours before the user has to
    // request a fresh one via "Resend verification email".
    private static final long VERIFICATION_TOKEN_TTL_HOURS = 24;

    @Autowired
    public PartnerUserServiceImpl(PasswordEncoder passwordEncoder,
                                  PartnerUserRepository partnerUserRepository,
                                  PartnerUserMapStruct partnerUserMapStruct,
                                  RoleRepository roleRepository,
                                  PropertyRepository propertyRepository,
                                  AppUserRepository appUserRepository,
                                  MailService mailService,
                                  OtpService otpService,
                                  PhoneOtpService phoneOtpService) {
        this.passwordEncoder = passwordEncoder;
        this.partnerUserRepository = partnerUserRepository;
        this.partnerUserMapStruct = partnerUserMapStruct;
        this.roleRepository = roleRepository;
        this.propertyRepository = propertyRepository;
        this.appUserRepository = appUserRepository;
        this.mailService = mailService;
        this.otpService = otpService;
        this.phoneOtpService = phoneOtpService;
    }

    @Override
    @Transactional
    public void saveUser(PartnerUserSignUpRequest signUpRequest) {
        if (checkBusinessNameExits(signUpRequest.getBusinessName())) {
            throw new AlreadyExistsException("Business name already exists.");
        }

        Role partnerRole = roleRepository.findByRoleName("PARTNER")
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("ROLE 'PARTNER' NOT DEFINED"));

        AppUser appUser;
        boolean isBrandNewAccount;

        if (appUserRepository.existsByEmail(signUpRequest.getEmail())) {
            // Existing user — add PARTNER role to their account. They already
            // have a verified (or grandfathered) email, so no new
            // verification email is needed here.
            appUser = appUserRepository.findByEmail(signUpRequest.getEmail())
                    .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

            boolean alreadyPartner = appUser.getRoles().stream()
                    .anyMatch(r -> r.getRoleName().equals("PARTNER"));
            if (alreadyPartner) {
                throw new AlreadyExistsException("User is already registered as a partner.");
            }

            if (appUser.getPartnerUser() != null) {
                throw new AlreadyExistsException("Partner profile already exists for this account.");
            }

            appUser.getRoles().add(partnerRole);
            isBrandNewAccount = false;
        } else {
            // New user — enforce phone uniqueness and create account
            if (appUserRepository.existsByPhoneNumber(signUpRequest.getPhoneNumber())) {
                throw new AlreadyExistsException("Phone number already in use.");
            }

            appUser = new AppUser();
            appUser.setFirstName(signUpRequest.getFirstName());
            appUser.setLastName(signUpRequest.getLastName());
            appUser.setEmail(signUpRequest.getEmail());
            appUser.setCountryCode(signUpRequest.getCountryCode());
            appUser.setPhoneNumber(signUpRequest.getPhoneNumber());
            appUser.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
            appUser.getRoles().add(partnerRole);
            isBrandNewAccount = true;
        }

        // The signup wizard verifies the email address up front via a 6-digit
        // OTP (step 1, before this account even exists — see OtpService). If
        // that already happened, the account is created already-verified and
        // we skip the older link-based email entirely, since asking the user
        // to verify twice would be redundant and confusing. The link-based
        // fallback stays in place for any request that reaches this endpoint
        // without having gone through OTP first (e.g. a stale client).
        boolean otpVerified = isBrandNewAccount && otpService.isVerified(signUpRequest.getEmail());

        if (isBrandNewAccount) {
            if (otpVerified) {
                appUser.setEmailVerified(true);
            } else {
                appUser.setEmailVerified(false);
                issueVerificationToken(appUser);
            }
        }
        appUser = appUserRepository.save(appUser);

        PartnerUser partnerProfile = partnerUserMapStruct.toEntity(signUpRequest);
        partnerProfile.setAppUser(appUser);
        partnerProfile.setIsVerified(VerificationEnum.UNVERIFIED);
        partnerProfile.setStatus(StatusEnum.INACTIVE);

        partnerUserRepository.save(partnerProfile);

        if (isBrandNewAccount) {
            if (otpVerified) {
                otpService.consume(signUpRequest.getEmail());
            } else {
                mailService.sendPartnerVerificationEmail(
                        appUser.getEmail(), appUser.getFirstName(), appUser.getVerificationToken());
            }
            // Phone verification (if the user completed it in step 1) has no
            // persistent "verified" column to set — unlike email, there's no
            // post-signup phone flow that needs it — so all that's left is
            // clearing the OTP record itself so it can't be replayed.
            if (phoneOtpService.isVerified(signUpRequest.getPhoneNumber())) {
                phoneOtpService.consume(signUpRequest.getPhoneNumber());
            }
        }
    }

    // ----------------------------------------------------------------
    // EMAIL VERIFICATION (self-serve, via emailed link)
    // ----------------------------------------------------------------

    private void issueVerificationToken(AppUser appUser) {
        appUser.setVerificationToken(UUID.randomUUID().toString());
        appUser.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(VERIFICATION_TOKEN_TTL_HOURS));
    }

    @Override
    @Transactional
    public String verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidException("Invalid or already-used verification link.");
        }

        AppUser appUser = appUserRepository.findByVerificationToken(token)
                .orElseThrow(() -> new InvalidException("Invalid or already-used verification link."));

        if (appUser.getVerificationTokenExpiresAt() == null
                || appUser.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidException("This verification link has expired. Please request a new one.");
        }

        appUser.setEmailVerified(true);
        appUser.setVerificationToken(null);
        appUser.setVerificationTokenExpiresAt(null);
        appUserRepository.save(appUser);

        return appUser.getEmail();
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        appUserRepository.findByEmail(email).ifPresent(appUser -> {
            // Nothing to do if they're already verified — don't leak state
            // via a different response, the controller always replies the
            // same generic "check your inbox" message either way.
            if (appUser.isEmailVerified()) {
                return;
            }
            issueVerificationToken(appUser);
            appUserRepository.save(appUser);
            mailService.sendPartnerVerificationEmail(
                    appUser.getEmail(), appUser.getFirstName(), appUser.getVerificationToken());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerProfileResponse partnerUserDetails(String userName){
        AppUser appUser = checkUserExists(userName);
        PartnerUser partnerProfile = appUser.getPartnerUser();

        if(partnerProfile == null) {
            throw new UnauthorizedAccessOrUnknownException("Partner Profile does not exist.");
        }
        return partnerUserMapStruct.toDTO(partnerProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerProfileResponse partnerUserDetails(Long id) {
        PartnerUser partnerUser = partnerUserRepository.findByAppUser_UserId(id)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Partner not found"));
        return partnerUserMapStruct.toDTO(partnerUser);
    }

    @Override
    @Transactional
    public void updatePartner(Long partnerId, PartnerUpdateRequest request) {
        PartnerUser partner = partnerUserRepository.findById(partnerId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Partner user not found"));

        AppUser appUser = partner.getAppUser();

        if (request.getFirstName() != null) appUser.setFirstName(request.getFirstName());
        if (request.getLastName() != null) appUser.setLastName(request.getLastName());

        // Update Phone/Email with uniqueness checks
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(appUser.getPhoneNumber())) {
            if (appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) throw new AlreadyExistsException("Phone in use");
            appUser.setPhoneNumber(request.getPhoneNumber());
        }

        partnerUserRepository.save(partner);
    }

    @Transactional(readOnly = true)
    public boolean checkStatusInProperty(Long partnerId){
        // FIXED: partnerId is the PartnerUser primary key.
        // We get the AppUser ID to find properties owned by this partner.
        PartnerUser partner = partnerUserRepository.findById(partnerId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Partner not found"));

        Long appUserId = partner.getAppUser().getUserId();

        // Use the updated repository method traversing Property -> PartnerUser -> AppUser
        List<Property> properties = propertyRepository.findByPartnerUser_AppUser_UserId(appUserId);

        return properties.stream()
                .anyMatch(p -> StatusEnum.ACTIVE.equals(p.getStatus()));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean userVerified(String userName){
        AppUser appUser = checkUserExists(userName);
        PartnerUser partnerUser = appUser.getPartnerUser();
        return partnerUser != null && partnerUser.getIsVerified() == VerificationEnum.VERIFIED;
    }

    public AppUser checkUserExists(String loginInput) {
        return appUserRepository.findByEmailOrPhoneNumber(loginInput, loginInput)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Invalid Username or Password"));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkBusinessNameExits(String businessName){
        return partnerUserRepository.existsByBusinessName(businessName);
    }

    // ----------------------------------------------------------------
    // SUPPORT PORTAL: List every partner (verified + unverified)
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<PartnerProfileResponse> getAllPartners() {
        // Hand-built mapping is used here (instead of MapStruct's toDTO) so we
        // can gracefully handle partner rows where the AppUser association is
        // missing and avoid propagating a LazyInitializationException.
        return partnerUserRepository.findAll()
                .stream()
                .map(this::toProfileResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    // ----------------------------------------------------------------
    // SUPPORT PORTAL: Mark an UNVERIFIED partner as VERIFIED
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public PartnerProfileResponse verifyPartner(Long partnerId) {
        PartnerUser partner = partnerUserRepository.findById(partnerId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Partner not found"));

        if (partner.getIsVerified() == VerificationEnum.VERIFIED) {
            throw new AlreadyExistsException("Partner is already verified.");
        }

        partner.setIsVerified(VerificationEnum.VERIFIED);
        partnerUserRepository.save(partner);
        return toProfileResponse(partner);
    }

    // ----------------------------------------------------------------
    // Null-safe PartnerUser -> PartnerProfileResponse mapping
    // ----------------------------------------------------------------
    private PartnerProfileResponse toProfileResponse(PartnerUser p) {
        PartnerProfileResponse dto = new PartnerProfileResponse();
        if (p == null) return dto;

        dto.setPartnerId(p.getPartnerId());
        dto.setBusinessType(p.getBusinessType());
        dto.setBusinessName(p.getBusinessName());
        dto.setBuildingNo(p.getBuildingNo());
        dto.setStreet(p.getStreet());
        dto.setCity(p.getCity());
        dto.setState(p.getState());
        dto.setCountry(p.getCountry());
        dto.setZipCode(p.getZipCode());
        dto.setIsVerified(p.getIsVerified());
        dto.setStatus(p.getStatus());

        try {
            AppUser appUser = p.getAppUser();
            if (appUser != null) {
                dto.setFirstName(appUser.getFirstName());
                dto.setLastName(appUser.getLastName());
                dto.setEmail(appUser.getEmail());
                dto.setCountryCode(appUser.getCountryCode());
                dto.setPhoneNumber(appUser.getPhoneNumber());
            }
        } catch (Exception ignored) {
            // Orphan partner row — leave the user fields as null rather than
            // blowing up the whole listing.
        }
        return dto;
    }
}