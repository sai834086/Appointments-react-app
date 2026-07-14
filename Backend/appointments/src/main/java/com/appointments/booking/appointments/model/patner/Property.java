package com.appointments.booking.appointments.model.patner;

import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.roles.Role;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@Data
@Table(name = "property")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "property_id")
    private Long propertyId;

    @Column(name="property_name", unique = true, nullable = false, length = 45)
    private String propertyName;

    @Column(name = "building_no", nullable = false, length = 45)
    private String buildingNo;

    @Column(name = "street", nullable = false, length = 45)
    private String street;

    @Column(name = "city", nullable = false, length = 45)
    private String city;

    @Column(name = "state", nullable = false, length = 45)
    private String state;

    @Column(name = "country", nullable = false, length = 45)
    private String country;

    @Column(name = "zip_code", nullable = false, length = 45)
    private String zipCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    private StatusEnum status;

    @OneToOne
    @JoinColumn(name = "manager_id")
    private AppUser manager;

    // The property's receptionists — a read-only role that can only view
    // this property's appointments (see ReceptionistLoginController and the
    // getAppointments authorization check). A property may have any number
    // of receptionists; the FK lives on AppUser (the "many" side), mirroring
    // the Employee <-> Property relationship below.
    @OneToMany(mappedBy = "receptionistProperty", fetch = FetchType.LAZY)
    @BatchSize(size = 25)
    private List<AppUser> receptionists = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference
    @BatchSize(size = 25)
    private List<Employee> employees;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @BatchSize(size = 25)
    private List<Services> services;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_user_id", referencedColumnName = "partner_id")
    private PartnerUser partnerUser;

    public Property(){
        this.status = StatusEnum.INACTIVE;
    }
}
