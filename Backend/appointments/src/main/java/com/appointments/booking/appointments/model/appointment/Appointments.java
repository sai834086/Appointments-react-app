package com.appointments.booking.appointments.model.appointment;

import com.appointments.booking.appointments.model.enums.AppointmentStatus;
import com.appointments.booking.appointments.model.patner.Employee;
import com.appointments.booking.appointments.model.patner.Property;
import com.appointments.booking.appointments.model.patner.Services;
import com.appointments.booking.appointments.model.appuser.AppUser;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "appointments")
public class Appointments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long appointmentId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime bookedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false, unique = true, updatable = false)
    private String confirmationNumber;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private Services services;

     @ManyToOne
     @JoinColumn(name = "user_id", nullable = false)
     private AppUser customer;

    @PrePersist
    protected void onCreate() {
        if (this.confirmationNumber == null) {
            this.confirmationNumber = generateConfirmationCode();
        }
        this.bookedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    private String generateConfirmationCode() {
        String uuid = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "CONF-" + uuid;
    }


    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
