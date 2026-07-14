package com.appointments.booking.appointments.model.patner;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.roles.Role;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@Data
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "first_name", nullable = false, length = 45)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 45)
    private String lastName;

    @Column(name = "email", length = 45)
    private String email;

    @Column(name = "phone_number", length = 10)
    private String phoneNumber;

    // NOTE: @Enumerated(EnumType.STRING) is intentionally omitted until the
    // employee.status column is normalized. Existing rows contain blank/empty
    // values that can't be parsed as StatusEnum names ("No enum constant
    // StatusEnum." 409 error). Once you've run:
    //   UPDATE employee SET status = 'ACTIVE'   WHERE status IN ('0','');
    //   UPDATE employee SET status = 'INACTIVE' WHERE status = '1';
    // re-add @Enumerated(EnumType.STRING) here for ordinal-safety.
    @Column(name = "status", length = 45, nullable = false)
    private StatusEnum status;

    @Column(name = "appointmentsOpenTillInMonths", nullable = false)
    private short appointmentsOpenTillInMonths;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonBackReference
    private Property property;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "property_employee_roles",
            joinColumns = @JoinColumn(name = "employee_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Availability> availability;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "employee_services",
            joinColumns = @JoinColumn(name = "employee_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    @JsonIgnoreProperties("employees")
    private List<Services> services;

    public Employee(){
        this.status = StatusEnum.INACTIVE;
        this.appointmentsOpenTillInMonths = 3;
    }

}
