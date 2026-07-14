package com.appointments.booking.appointments.model.patner;

import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.enums.VerificationEnum;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.List;

@Entity
@Table(name = "partner_user")
@EntityListeners(AuditingEntityListener.class)
@AllArgsConstructor
@Data
public class PartnerUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "business_type", nullable = false, length = 45)
    private String businessType;

    @Column(name = "business_name", nullable = false, length = 45, unique = true)
    private String businessName;

    @Column(name = "building_no", nullable = false, length = 45)
    private String buildingNo;

    @Column(name = "street", nullable = false, length = 45)
    private String street;

    @Column(name = "city", nullable = false, length = 45)
    private String city;

    @Column(name = "district", length = 45)
    private String district;

    @Column(name = "state", nullable = false, length = 45)
    private String state;

    @Column(name = "country", nullable = false, length = 45)
    private String country;

    @Column(name = "zip_code", nullable = false, length = 45)
    private String zipCode;

    @Enumerated(EnumType.STRING)
    @Column(name="is_verified", nullable = false, length = 25)
    private VerificationEnum isVerified;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    private StatusEnum status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser appUser;

    @OneToMany(mappedBy = "partnerUser", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference
    private List<Property> properties;

    public PartnerUser() {
        this.isVerified = VerificationEnum.UNVERIFIED;
        this.status = StatusEnum.INACTIVE;
    }
}


