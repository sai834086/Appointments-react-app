package com.appointments.booking.appointments.model.appuser;

import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.roles.Role;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Data
@Table(name = "app_user")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "first_name", nullable = false, length = 45)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 45)
    private String lastName;

    @Column(name = "email", nullable = false, length = 45, unique = true)
    private String email;

    @Column(name = "phone_number", length = 45, nullable = false, unique = true)
    private String phoneNumber;

    // Dial code selected alongside phoneNumber in the signup wizard (e.g.
    // "+91"), stored separately so the existing phoneNumber format/validation
    // (plain 10-digit string) doesn't have to change. Defaults to an empty
    // string for rows that existed before this column was added — we have no
    // way to know their actual country, so we leave it unknown rather than
    // guessing.
    @Column(name = "country_code", length = 6, nullable = false, columnDefinition = "VARCHAR(6) DEFAULT ''")
    private String countryCode = "";

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "user_created_at", nullable = false, updatable = false)
    private LocalDateTime userCreatedAt;

    @Column(name = "password", nullable = false, length = 500)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "app_user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "appUser", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private PartnerUser partnerUser;

    // Set only for AppUsers holding the RECEPTIONIST role — the single
    // property they're assigned to. A property can have many receptionists,
    // but each receptionist belongs to at most one property, so the foreign
    // key lives here (the "many" side), mirroring Employee -> Property.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptionist_property_id")
    private Property receptionistProperty;

    // ----------------------------------------------------------------
    // Email verification (self-serve, via emailed link) — distinct from
    // PartnerUser.isVerified, which is a manual staff/business review done
    // through the Support portal. This just proves the person owns the
    // email address they signed up with.
    //
    // Default is TRUE with an explicit DEFAULT in the column so existing
    // rows (created before this feature existed) are grandfathered in as
    // already-verified instead of being locked out of login. New accounts
    // created through the signup flow explicitly set this to false so the
    // verification email flow actually applies to them.
    // ----------------------------------------------------------------
    @Column(name = "email_verified", nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private boolean emailVerified = true;

    @Column(name = "verification_token", length = 100, unique = true)
    private String verificationToken;

    @Column(name = "verification_token_expires_at")
    private LocalDateTime verificationTokenExpiresAt;
}
