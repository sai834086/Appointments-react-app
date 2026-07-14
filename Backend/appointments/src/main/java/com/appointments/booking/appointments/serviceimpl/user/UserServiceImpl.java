package com.appointments.booking.appointments.serviceimpl.user;

import com.appointments.booking.appointments.exception.AlreadyExistsException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.user.UserMapStruct;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.roles.Role;
import com.appointments.booking.appointments.payload.request.admin.RegisterRequest;
import com.appointments.booking.appointments.payload.request.support.SupportRegisterRequest;
import com.appointments.booking.appointments.payload.request.user.UserSignUpRequest;
import com.appointments.booking.appointments.payload.request.user.UserUpdateRequest;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import com.appointments.booking.appointments.repository.roles.RoleRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    private final AppUserRepository appUserRepository;
    private final UserMapStruct userMapStruct;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @Autowired
    public UserServiceImpl(AppUserRepository appUserRepository,
                           UserMapStruct userMapStruct,
                           PasswordEncoder passwordEncoder,
                           RoleRepository roleRepository) {
        this.appUserRepository = appUserRepository;
        this.userMapStruct = userMapStruct;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    // ----------------------------------------------------------------
    // 1. SIGN UP (End User)
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void saveUser(UserSignUpRequest userDTO) {
        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new RuntimeException("USER ROLE NOT DEFINED"));

        if (appUserRepository.existsByEmail(userDTO.getEmail())) {
            // Existing account — add USER role if not already present
            AppUser appUser = appUserRepository.findByEmail(userDTO.getEmail())
                    .orElseThrow(() -> new AlreadyExistsException("Email already in use"));

            boolean alreadyUser = appUser.getRoles().stream()
                    .anyMatch(r -> r.getRoleName().equals("USER"));
            if (alreadyUser) {
                throw new AlreadyExistsException("Email already in use");
            }

            appUser.getRoles().add(userRole);
            appUserRepository.save(appUser);
        } else {
            // New account — enforce phone uniqueness
            if (appUserRepository.existsByPhoneNumber(userDTO.getPhoneNumber())) {
                throw new AlreadyExistsException("Phone number already in use");
            }

            AppUser appUser = userMapStruct.toEntity(userDTO);
            appUser.getRoles().add(userRole);
            appUser.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            appUserRepository.save(appUser);
        }
    }

    // ----------------------------------------------------------------
    // 2. LOGIN LOGIC (UserDetailsService)
    // ----------------------------------------------------------------
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Fetch User (Email OR Phone)
        AppUser appUser = checkUserExists(username);

        List<SimpleGrantedAuthority> authorities = appUser.getRoles()
                .stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(appUser.getEmail()) // Use Email as principal
                .password(appUser.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .build();
    }

    // ----------------------------------------------------------------
    // 3. GET PROFILE (By Username/Input)
    // ----------------------------------------------------------------
    @Override
    public AppUserProfileResponse userDetails(String userName) {
        AppUser appUser = checkUserExists(userName);
        return userMapStruct.EntityToDTO(appUser);
    }

    // ----------------------------------------------------------------
    // 4. GET PROFILE (By ID)
    // ----------------------------------------------------------------
    @Override
    public AppUserProfileResponse getUserDetails(Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        return AppUserProfileResponse.builder()
                .appUserId(user.getUserId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }

    @Override
    public Long getAppUserId(String userName) {
        return checkUserExists(userName).getUserId();
    }

    // ----------------------------------------------------------------
    // 5. UPDATE USER
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void updateUserDetails(Long userId, UserUpdateRequest request) {

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        // Update Name
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName());
        }

        // Update Phone (With Unique Check)
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            if (!request.getPhoneNumber().equals(user.getPhoneNumber())
                    && appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new AlreadyExistsException("Phone Number already taken");
            }
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // Update Email (With Unique Check)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!request.getEmail().equals(user.getEmail())
                    && appUserRepository.existsByEmail(request.getEmail())) {
                throw new AlreadyExistsException("Email already taken");
            }
            user.setEmail(request.getEmail());
        }

        appUserRepository.save(user);
    }

    // ----------------------------------------------------------------
    // 6. ADMIN REGISTRATION
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void registerAdmin(RegisterRequest request) {

        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new AlreadyExistsException("Email already in use");
        }

        AppUser newAdmin = new AppUser();
        newAdmin.setEmail(request.getEmail());
        newAdmin.setPassword(passwordEncoder.encode(request.getPassword()));
        // Note: Set default names or handle nulls if required by DB constraints
        newAdmin.setFirstName("Admin");
        newAdmin.setLastName("User");

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Error: Role 'ADMIN' not found."));

        newAdmin.getRoles().add(adminRole);

        appUserRepository.save(newAdmin);
    }

    // ----------------------------------------------------------------
    // 7. REGISTER SUPPORT USER
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void registerSupport(SupportRegisterRequest request) {
        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new AlreadyExistsException("Email already in use");
        }
        if (appUserRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AlreadyExistsException("Phone number already in use");
        }

        AppUser support = new AppUser();
        support.setFirstName(request.getFirstName());
        support.setLastName(request.getLastName());
        support.setEmail(request.getEmail());
        support.setPhoneNumber(request.getPhoneNumber());
        support.setPassword(passwordEncoder.encode(request.getPassword()));

        Role supportRole = roleRepository.findByRoleName("SUPPORT")
                .orElseThrow(() -> new RuntimeException("Role 'SUPPORT' not found"));
        support.getRoles().add(supportRole);

        appUserRepository.save(support);
    }

    // ----------------------------------------------------------------
    // 8. GET ALL APP USERS (for support)
    // ----------------------------------------------------------------
    @Override
    public List<AppUserProfileResponse> getAllAppUsers() {
        return appUserRepository.findAll()
                .stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getRoleName().equals("USER")))
                .map(u -> AppUserProfileResponse.builder()
                        .appUserId(u.getUserId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getEmail())
                        .phoneNumber(u.getPhoneNumber())
                        .build())
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // 9. GET ALL SUPPORT USERS (for admin)
    // ----------------------------------------------------------------
    @Override
    public List<AppUserProfileResponse> getSupportUsers() {
        return appUserRepository.findAll()
                .stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getRoleName().equals("SUPPORT")))
                .map(u -> AppUserProfileResponse.builder()
                        .appUserId(u.getUserId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getEmail())
                        .phoneNumber(u.getPhoneNumber())
                        .build())
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // HELPER: Unified Lookup
    // ----------------------------------------------------------------
    public AppUser checkUserExists(String loginInput) {
        // Uses the single-query method we added to AppUserRepository
        return appUserRepository.findByEmailOrPhoneNumber(loginInput, loginInput)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}