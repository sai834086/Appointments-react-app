package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.PropertyMapStruct;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.roles.Role;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ManagerRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.ReceptionistRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyRegisterRequest;
import com.appointments.booking.appointments.payload.request.patner.propertyRequests.PropertyUpdateRequest;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ManagerDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.ReceptionistDetailsResponse;
import com.appointments.booking.appointments.payload.response.patner.propertyResponse.PropertyDetailsResponse;
import com.appointments.booking.appointments.repository.patner.PartnerUserRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.roles.RoleRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.mail.MailService;
import com.appointments.booking.appointments.service.patner.PropertyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PropertyServiceImpl implements PropertyService {

    private static final Logger log = LoggerFactory.getLogger(PropertyServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PropertyRepository propertyRepository;
    private final PropertyMapStruct propertyMapStruct;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final MailService mailService;

    private final PartnerUserRepository partnerUserRepository;

    @Autowired
    public PropertyServiceImpl(PropertyRepository propertyRepository,
                               PropertyMapStruct propertyMapStruct,
                               AppUserRepository appUserRepository,
                               PasswordEncoder passwordEncoder,
                               RoleRepository roleRepository, PartnerUserRepository partnerUserRepository,
                               MailService mailService) {
        this.propertyRepository = propertyRepository;
        this.propertyMapStruct = propertyMapStruct;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.partnerUserRepository = partnerUserRepository;
        this.mailService = mailService;
    }

    // ----------------------------------------------------------------
    // 1. ADD PROPERTY
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void addProperty(PropertyRegisterRequest dto, Long ownerId) {

        // Validation: Global check for property name uniqueness
        if(checkPropertyExists(dto.getPropertyName())) {
            throw new AlreadyExistsException("Property Name with this name already exists");
        }

        // Fetch the Owner (The logged-in Partner)
        AppUser owner = appUserRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Owner not found"));

        PartnerUser partner = partnerUserRepository.findByAppUser_UserId(ownerId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Partner profile not found for this user"));

        // Convert DTO to Entity
        Property property = propertyMapStruct.toEntity(dto);

        property.setPartnerUser(partner);

        // Logic: Who is the manager?
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            AppUser manager = appUserRepository.findByEmail(dto.getEmail())
                    .orElseGet(() -> {
                        AppUser newManager = new AppUser();
                        newManager.setFirstName(dto.getFirstName());
                        newManager.setLastName(dto.getLastName());
                        newManager.setEmail(dto.getEmail());
                        newManager.setPhoneNumber(dto.getPhoneNumber());
                        newManager.setPassword(passwordEncoder.encode(dto.getPassword()));

                        Role managerRole = roleRepository.findByRoleName("MANAGER")
                                .orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
                        newManager.setRoles(Set.of(managerRole));

                        return appUserRepository.save(newManager);
                    });

            property.setManager(manager);
        } else {
            // No manager info? The Owner acts as the manager.
            property.setManager(owner);
        }

        // Finalize status and save
        if (property.getStatus() == null) {
            property.setStatus(StatusEnum.INACTIVE);
        }

        propertyRepository.save(property);
    }

    // ----------------------------------------------------------------
    // 2. GET ALL PROPERTIES FOR OWNER
    // ----------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<PropertyDetailsResponse> allPropertyDetails(Long userId) {

        // UPDATED: Traversing Property -> PartnerUser -> AppUser -> UserId
        List<Property> properties = propertyRepository.findByPartnerUser_AppUser_UserId(userId);

        if(properties.isEmpty()){
            throw new UnauthorizedAccessOrUnknownException("No properties found for this user");
        }
        List<PropertyDetailsResponse> responses = propertyMapStruct.toResponse(properties);
        // Manually attach the manager block (MapStruct builds the flat contact
        // fields; the nested manager is built here so the service owns the
        // 'isOwner' logic in one place). Also stamp the employee/service totals
        // so the partner dashboard cards can show counts without N+1 calls.
        for (int i = 0; i < properties.size(); i++) {
            Property property = properties.get(i);
            PropertyDetailsResponse response = responses.get(i);
            response.setManager(buildManagerResponse(property.getManager(), userId));
            response.setReceptionists(buildReceptionistListResponse(property.getReceptionists()));
            response.setTotalEmployees(
                    property.getEmployees() == null ? 0 : property.getEmployees().size());
            response.setTotalServices(
                    property.getServices() == null ? 0 : property.getServices().size());
            // Employee status breakdown for the property card — the list is
            // already loaded above, so this adds no extra queries.
            response.setActiveEmployees(
                    property.getEmployees() == null
                            ? 0
                            : (int) property.getEmployees().stream()
                                    .filter(e -> e.getStatus() == StatusEnum.ACTIVE)
                                    .count());
            // Service breakdown: ACTIVE = offered by at least one employee.
            // Derived from the link so legacy NULL-status rows count right.
            response.setActiveServices(
                    property.getServices() == null
                            ? 0
                            : (int) property.getServices().stream()
                                    .filter(s -> s.getEmployees() != null && !s.getEmployees().isEmpty())
                                    .count());
        }
        return responses;
    }

    // ----------------------------------------------------------------
    // 3. UPDATE PROPERTY
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public PropertyDetailsResponse updateProperty(PropertyUpdateRequest dto, Long propertyId, Long userId) {

        // UPDATED: Fetch Property AND verify ownership via PartnerUser
        Property existingProperty = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Property not found or you are not the owner"));

        // Only check for duplicates if the name is changing
        if (dto.getPropertyName() != null && !dto.getPropertyName().equals(existingProperty.getPropertyName())) {
            if (checkPropertyExists(dto.getPropertyName())) {
                throw new AlreadyExistsException("Property name already exists, choose a different name");
            }
        }

        // Update fields and save
        propertyMapStruct.updateEntityFromDto(dto, existingProperty);
        Property savedProperty = propertyRepository.save(existingProperty);

        PropertyDetailsResponse response = propertyMapStruct.toResponse(savedProperty);
        response.setManager(buildManagerResponse(savedProperty.getManager(), userId));
        return response;
    }

    // ----------------------------------------------------------------
    // 4. MANAGER OPERATIONS
    // ----------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public ManagerDetailsResponse getManager(Long propertyId, Long userId) {
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you are not the owner"));

        AppUser manager = property.getManager();
        if (manager == null) {
            return null;
        }

        ManagerDetailsResponse response = new ManagerDetailsResponse();
        response.setUserId(manager.getUserId());
        response.setFirstName(manager.getFirstName());
        response.setLastName(manager.getLastName());
        response.setEmail(manager.getEmail());
        response.setPhoneNumber(manager.getPhoneNumber());
        response.setOwner(manager.getUserId().equals(userId));
        return response;
    }

    @Override
    @Transactional
    public ManagerDetailsResponse addManager(Long propertyId, ManagerRequest request, Long userId) {
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you are not the owner"));

        // "Add Manager" means the partner wants to assign a dedicated manager.
        // If a non-owner manager is already set, refuse — they should use update instead.
        if (property.getManager() != null && !property.getManager().getUserId().equals(userId)) {
            throw new AlreadyExistsException(
                    "A manager is already assigned to this property. Use update instead.");
        }

        // Don't let the partner assign themselves (that's the "no manager" state).
        AppUser owner = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Owner not found"));
        if (owner.getEmail() != null && owner.getEmail().equalsIgnoreCase(request.getEmail())) {
            throw new InvalidException("You can't assign yourself as the manager.");
        }

        // Reject up-front if the email or phone number is already used by
        // any other account in the system. We surface a single combined
        // message so the partner gets clear, actionable feedback regardless
        // of which field collided.
        if (appUserRepository.findByEmail(request.getEmail()).isPresent()
                || appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException(
                    "Email or phone number already exists");
        }

        // Security: the partner never chooses the manager's password. The
        // account is created with a strong random one the manager never
        // sees; the invite email links to the first-login password setup.
        AppUser created = new AppUser();
        created.setFirstName(request.getFirstName().trim());
        created.setLastName(request.getLastName().trim());
        created.setEmail(request.getEmail().trim());
        created.setPhoneNumber(request.getPhoneNumber().trim());
        created.setPassword(passwordEncoder.encode(generateTemporaryPassword()));
        Role managerRole = roleRepository.findByRoleName("MANAGER")
                .orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
        created.setRoles(Set.of(managerRole));
        AppUser manager = appUserRepository.save(created);

        property.setManager(manager);
        propertyRepository.save(property);

        sendManagerInvite(property, manager);

        ManagerDetailsResponse response = new ManagerDetailsResponse();
        response.setUserId(manager.getUserId());
        response.setFirstName(manager.getFirstName());
        response.setLastName(manager.getLastName());
        response.setEmail(manager.getEmail());
        response.setPhoneNumber(manager.getPhoneNumber());
        response.setOwner(false);
        return response;
    }

    @Override
    @Transactional
    public ManagerDetailsResponse updateManager(Long propertyId, ManagerRequest request, Long userId) {
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you are not the owner"));

        AppUser currentManager = property.getManager();
        if (currentManager == null || currentManager.getUserId().equals(userId)) {
            // No dedicated manager yet — redirect to the "add" flow
            return addManager(propertyId, request, userId);
        }

        // Refuse to update the owner via this endpoint
        String newEmail = request.getEmail() == null ? null : request.getEmail().trim();
        String currentEmail = currentManager.getEmail();

        if (newEmail != null && !newEmail.equalsIgnoreCase(currentEmail)) {
            // Changing the email means assigning a different AppUser as manager.
            // Reuse an existing account or create a new one (same flow as add).
            return reassignManager(property, request, userId);
        }

        // Same user — just update their details
        currentManager.setFirstName(request.getFirstName().trim());
        currentManager.setLastName(request.getLastName().trim());
        // Don't change email when it matches (case-insensitive)
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                && !request.getPhoneNumber().equals(currentManager.getPhoneNumber())) {
            if (appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new AlreadyExistsException(
                        "Email or phone number already exists");
            }
            currentManager.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            currentManager.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        ensureManagerRole(currentManager);
        appUserRepository.save(currentManager);

        ManagerDetailsResponse response = new ManagerDetailsResponse();
        response.setUserId(currentManager.getUserId());
        response.setFirstName(currentManager.getFirstName());
        response.setLastName(currentManager.getLastName());
        response.setEmail(currentManager.getEmail());
        response.setPhoneNumber(currentManager.getPhoneNumber());
        response.setOwner(false);
        return response;
    }

    @Override
    @Transactional
    public void removeManager(Long propertyId, Long userId) {
        Property property = propertyRepository.findByPropertyIdAndPartnerUser_AppUser_UserId(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you are not the owner"));

        AppUser currentManager = property.getManager();
        // Nothing to do if there's no dedicated manager (owner standing in is
        // represented by manager==null OR manager==owner; treat both as no-op).
        if (currentManager == null || currentManager.getUserId().equals(userId)) {
            return;
        }

        property.setManager(null);
        propertyRepository.save(property);

        // Removing a manager also removes their user account — but only
        // when it's safe: they must not manage any other property, and the
        // account must be a pure MANAGER account (never delete someone who
        // is also a partner or a booking customer).
        boolean stillManagesElsewhere =
                propertyRepository.findByManager_UserId(currentManager.getUserId()).isPresent();
        boolean pureManagerAccount = currentManager.getRoles() != null
                && !currentManager.getRoles().isEmpty()
                && currentManager.getRoles().stream()
                        .allMatch(r -> "MANAGER".equals(r.getRoleName()));

        if (!stillManagesElsewhere && pureManagerAccount) {
            appUserRepository.delete(currentManager);
            log.info("Deleted manager account {} after unassignment from property {}",
                    currentManager.getEmail(), property.getPropertyId());
        }
    }

    // ----------------------------------------------------------------
    // 5. HELPERS
    // ----------------------------------------------------------------
    @Transactional(readOnly = true)
    public boolean checkPropertyExists(String propertyName){
        return propertyRepository.findByPropertyName(propertyName) != null;
    }

    private ManagerDetailsResponse buildManagerResponse(AppUser manager, Long ownerId) {
        if (manager == null) return null;
        ManagerDetailsResponse m = new ManagerDetailsResponse();
        m.setUserId(manager.getUserId());
        m.setFirstName(manager.getFirstName());
        m.setLastName(manager.getLastName());
        m.setEmail(manager.getEmail());
        m.setPhoneNumber(manager.getPhoneNumber());
        m.setOwner(manager.getUserId() != null && manager.getUserId().equals(ownerId));
        return m;
    }

    private void ensureManagerRole(AppUser user) {
        Role managerRole = roleRepository.findByRoleName("MANAGER")
                .orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }
        if (!user.getRoles().contains(managerRole)) {
            user.getRoles().add(managerRole);
        }
    }

    private ManagerDetailsResponse reassignManager(Property property, ManagerRequest request, Long userId) {
        // Same semantics as addManager but allowing replacement
        AppUser owner = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Owner not found"));
        if (owner.getEmail() != null && owner.getEmail().equalsIgnoreCase(request.getEmail())) {
            throw new InvalidException("You can't assign yourself as the manager.");
        }

        // Reject up-front if the email or phone is in use by any other
        // account. Same unified message as addManager so the UX is
        // consistent across both flows.
        if (appUserRepository.findByEmail(request.getEmail()).isPresent()
                || appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException(
                    "Email or phone number already exists");
        }

        // Same policy as addManager: random password + invite email.
        AppUser created = new AppUser();
        created.setFirstName(request.getFirstName().trim());
        created.setLastName(request.getLastName().trim());
        created.setEmail(request.getEmail().trim());
        created.setPhoneNumber(request.getPhoneNumber().trim());
        created.setPassword(passwordEncoder.encode(generateTemporaryPassword()));
        Role managerRole = roleRepository.findByRoleName("MANAGER")
                .orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
        created.setRoles(Set.of(managerRole));
        AppUser manager = appUserRepository.save(created);

        property.setManager(manager);
        propertyRepository.save(property);

        sendManagerInvite(property, manager);

        ManagerDetailsResponse response = new ManagerDetailsResponse();
        response.setUserId(manager.getUserId());
        response.setFirstName(manager.getFirstName());
        response.setLastName(manager.getLastName());
        response.setEmail(manager.getEmail());
        response.setPhoneNumber(manager.getPhoneNumber());
        response.setOwner(false);
        return response;
    }

    /**
     * 24 random characters guaranteed to satisfy the password policy
     * (upper, lower, digit, special). The manager never sees this value —
     * it only exists so the account has an unguessable credential until
     * they set their own via the invite link.
     */
    private String generateTemporaryPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "@#$%^&+=!";
        String all = upper + lower + digits + special;

        List<Character> chars = new ArrayList<>();
        chars.add(upper.charAt(SECURE_RANDOM.nextInt(upper.length())));
        chars.add(lower.charAt(SECURE_RANDOM.nextInt(lower.length())));
        chars.add(digits.charAt(SECURE_RANDOM.nextInt(digits.length())));
        chars.add(special.charAt(SECURE_RANDOM.nextInt(special.length())));
        for (int i = chars.size(); i < 24; i++) {
            chars.add(all.charAt(SECURE_RANDOM.nextInt(all.length())));
        }
        Collections.shuffle(chars, SECURE_RANDOM);

        StringBuilder sb = new StringBuilder(chars.size());
        chars.forEach(sb::append);
        return sb.toString();
    }

    /**
     * Fire the invitation email after the account exists. Mail failures are
     * logged inside MailService rather than thrown, so a mail-provider
     * hiccup never rolls back the manager assignment — the manager can
     * always use "Forgot password" on the login page as a fallback.
     */
    private void sendManagerInvite(Property property, AppUser manager) {
        String businessName = property.getPartnerUser() != null
                ? property.getPartnerUser().getBusinessName()
                : null;
        mailService.sendManagerInviteEmail(
                manager.getEmail(),
                manager.getFirstName(),
                businessName,
                property.getPropertyName());
    }

    // ----------------------------------------------------------------
    // 6. RECEPTIONIST OPERATIONS
    // ----------------------------------------------------------------
    // Receptionists are a read-only, appointments-only role. A property can
    // have any number of receptionists (front desks are often staffed by
    // more than one person) — the FK lives on AppUser.receptionistProperty
    // (the "many" side), mirroring Employee <-> Property. Property is no
    // longer the owning side of this relationship, so these methods persist
    // via appUserRepository rather than propertyRepository.

    @Override
    @Transactional(readOnly = true)
    public List<ReceptionistDetailsResponse> getReceptionists(Long propertyId, Long userId) {
        // Defense-in-depth: receptionist-management methods must only ever
        // be reachable by a partner or manager, never by a receptionist —
        // even if a future change relaxes @PreAuthorize on the controller or
        // swaps in a different (receptionist-inclusive) lookup query below.
        assertCallerIsNotReceptionist(userId);

        // Partner (owner) OR the property's assigned manager may view/manage
        // its receptionists — same scoping used for employees/services.
        Property property = propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you don't have access to it"));

        return buildReceptionistListResponse(property.getReceptionists());
    }

    @Override
    @Transactional
    public ReceptionistDetailsResponse addReceptionist(Long propertyId, ReceptionistRequest request, Long userId) {
        assertCallerIsNotReceptionist(userId);

        Property property = propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you don't have access to it"));

        // "Caller" here is whoever is assigning the receptionist — the
        // property's partner owner or its assigned manager — not
        // necessarily the partner. Either way, they can't assign themselves.
        AppUser caller = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Caller not found"));
        if (caller.getEmail() != null && caller.getEmail().equalsIgnoreCase(request.getEmail())) {
            throw new InvalidException("You can't assign yourself as the receptionist.");
        }

        if (appUserRepository.findByEmail(request.getEmail()).isPresent()
                || appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException(
                    "Email or phone number already exists");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new InvalidException("Password is required for a new receptionist account.");
        }

        AppUser created = new AppUser();
        created.setFirstName(request.getFirstName().trim());
        created.setLastName(request.getLastName().trim());
        created.setEmail(request.getEmail().trim());
        created.setPhoneNumber(request.getPhoneNumber().trim());
        created.setPassword(passwordEncoder.encode(request.getPassword()));
        Role receptionistRole = roleRepository.findByRoleName("RECEPTIONIST")
                .orElseThrow(() -> new RuntimeException("Role RECEPTIONIST not found"));
        created.setRoles(Set.of(receptionistRole));
        created.setReceptionistProperty(property);
        AppUser receptionist = appUserRepository.save(created);

        return buildReceptionistResponse(receptionist);
    }

    @Override
    @Transactional
    public ReceptionistDetailsResponse updateReceptionist(Long propertyId, Long receptionistId, ReceptionistRequest request, Long userId) {
        assertCallerIsNotReceptionist(userId);

        propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you don't have access to it"));

        AppUser currentReceptionist = appUserRepository
                .findByUserIdAndReceptionistProperty_PropertyId(receptionistId, propertyId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Receptionist not found for this property"));

        String newEmail = request.getEmail() == null ? null : request.getEmail().trim();
        String currentEmail = currentReceptionist.getEmail();

        if (newEmail != null && !newEmail.equalsIgnoreCase(currentEmail)) {
            // Changing the email is treated as swapping in a different person
            // for this receptionist slot: detach the current AppUser (they
            // keep their account, just lose this property) and create/attach
            // a new one with the new email.
            return reassignReceptionist(currentReceptionist, request, userId);
        }

        currentReceptionist.setFirstName(request.getFirstName().trim());
        currentReceptionist.setLastName(request.getLastName().trim());
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                && !request.getPhoneNumber().equals(currentReceptionist.getPhoneNumber())) {
            if (appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new AlreadyExistsException(
                        "Email or phone number already exists");
            }
            currentReceptionist.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            currentReceptionist.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        ensureReceptionistRole(currentReceptionist);
        appUserRepository.save(currentReceptionist);

        return buildReceptionistResponse(currentReceptionist);
    }

    @Override
    @Transactional
    public void removeReceptionist(Long propertyId, Long receptionistId, Long userId) {
        assertCallerIsNotReceptionist(userId);

        propertyRepository.findByPropertyIdAuthorizedForUser(propertyId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Property not found or you don't have access to it"));

        AppUser receptionist = appUserRepository
                .findByUserIdAndReceptionistProperty_PropertyId(receptionistId, propertyId)
                .orElse(null);
        if (receptionist == null) {
            // Already not assigned to this property — treat as a no-op so
            // repeat/parallel removals don't error.
            return;
        }

        receptionist.setReceptionistProperty(null);
        appUserRepository.save(receptionist);
        // We intentionally do NOT delete the AppUser — they may still be a
        // receptionist elsewhere or want to retain login access.
    }

    // Belt-and-suspenders check: a receptionist must never be able to view
    // or manage other receptionists on their property, regardless of what
    // @PreAuthorize allows at the controller layer or which repository
    // query a given method happens to use. RECEPTIONIST accounts should
    // never reach this far, but if they do, fail loudly instead of
    // silently trusting the caller's role.
    private void assertCallerIsNotReceptionist(Long userId) {
        AppUser caller = appUserRepository.findById(userId).orElse(null);
        if (caller != null && caller.getRoles() != null
                && caller.getRoles().stream().anyMatch(r -> "RECEPTIONIST".equalsIgnoreCase(r.getRoleName()))) {
            throw new UnauthorizedAccessOrUnknownException(
                    "Receptionists cannot view or manage other receptionists");
        }
    }

    private ReceptionistDetailsResponse buildReceptionistResponse(AppUser receptionist) {
        if (receptionist == null) return null;
        ReceptionistDetailsResponse r = new ReceptionistDetailsResponse();
        r.setUserId(receptionist.getUserId());
        r.setFirstName(receptionist.getFirstName());
        r.setLastName(receptionist.getLastName());
        r.setEmail(receptionist.getEmail());
        r.setPhoneNumber(receptionist.getPhoneNumber());
        return r;
    }

    private List<ReceptionistDetailsResponse> buildReceptionistListResponse(List<AppUser> receptionists) {
        if (receptionists == null || receptionists.isEmpty()) return new ArrayList<>();
        return receptionists.stream()
                .map(this::buildReceptionistResponse)
                .collect(Collectors.toList());
    }

    private void ensureReceptionistRole(AppUser user) {
        Role receptionistRole = roleRepository.findByRoleName("RECEPTIONIST")
                .orElseThrow(() -> new RuntimeException("Role RECEPTIONIST not found"));
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }
        if (!user.getRoles().contains(receptionistRole)) {
            user.getRoles().add(receptionistRole);
        }
    }

    private ReceptionistDetailsResponse reassignReceptionist(AppUser outgoingReceptionist, ReceptionistRequest request, Long userId) {
        AppUser caller = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Caller not found"));
        if (caller.getEmail() != null && caller.getEmail().equalsIgnoreCase(request.getEmail())) {
            throw new InvalidException("You can't assign yourself as the receptionist.");
        }

        if (appUserRepository.findByEmail(request.getEmail()).isPresent()
                || appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException(
                    "Email or phone number already exists");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new InvalidException(
                    "Password is required to create a new receptionist account.");
        }

        Property property = outgoingReceptionist.getReceptionistProperty();

        outgoingReceptionist.setReceptionistProperty(null);
        appUserRepository.save(outgoingReceptionist);

        AppUser created = new AppUser();
        created.setFirstName(request.getFirstName().trim());
        created.setLastName(request.getLastName().trim());
        created.setEmail(request.getEmail().trim());
        created.setPhoneNumber(request.getPhoneNumber().trim());
        created.setPassword(passwordEncoder.encode(request.getPassword()));
        Role receptionistRole = roleRepository.findByRoleName("RECEPTIONIST")
                .orElseThrow(() -> new RuntimeException("Role RECEPTIONIST not found"));
        created.setRoles(Set.of(receptionistRole));
        created.setReceptionistProperty(property);
        AppUser receptionist = appUserRepository.save(created);

        return buildReceptionistResponse(receptionist);
    }
}
