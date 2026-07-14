package com.appointments.booking.appointments.config;

import com.appointments.booking.appointments.model.roles.Role;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.repository.roles.RoleRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(AppUserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // 1. Define all roles you want in the system
        List<String> roles = Arrays.asList("ADMIN", "PARTNER", "USER", "MANAGER", "SUPPORT", "RECEPTIONIST");

        // 2. Loop through and create them if they don't exist
        for (String roleName : roles) {
            createRoleIfNotFound(roleName);
        }

        // 3. Create Super Admin User
        if (!userRepository.existsByEmail("admin@admin.com")) {

            AppUser admin = new AppUser();
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            admin.setEmail("admin@admin.com");
            admin.setPassword(passwordEncoder.encode("HighlySecuredPassword")); // Default password
            admin.setPhoneNumber("1234567890"); // Dummy phone number to satisfy NotNull constraint

            // Note: If you have a 'userCreatedAt' field that isn't auto-filled, set it here:
            // admin.setUserCreatedAt(LocalDateTime.now());

            // Assign ADMIN Role
            Role adminRole = roleRepository.findByRoleName("ADMIN").orElseThrow();
            admin.setRoles(Set.of(adminRole));

            userRepository.save(admin);
            System.out.println("✅ Admin User Created: admin@admin.com / password");
        }
    }

    // --- HELPER METHOD ---
    private void createRoleIfNotFound(String name) {
        if (roleRepository.findByRoleName(name).isEmpty()) {
            Role role = new Role();
            role.setRoleName(name);
            roleRepository.save(role);
            System.out.println("🔹 Role Created: " + name);
        }
    }
}