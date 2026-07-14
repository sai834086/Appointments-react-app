package com.appointments.booking.appointments.model.patner;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "availability")
public class Availability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "availability_id")
    private Long availabilityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "day", nullable = false, length = 20)
    private DayEnum day;

    @Enumerated(EnumType.STRING)
    @Column(name = "is_availabile", nullable = false, length = 20)
    private AvailabileEnum isAvailable;

    @JsonFormat(pattern = "HH:mm")
    @Column(name = "open_time", columnDefinition = "TIME")
    private LocalTime openTime;

    @JsonFormat(pattern = "HH:mm")
    @Column(name = "close_time", columnDefinition = "TIME")
    private LocalTime closeTime;


    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;

    @OneToMany(mappedBy = "availability", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<OffTime> offTime;

    @PrePersist
    @PreUpdate
    public void validateAvailability() {
        if (this.isAvailable == AvailabileEnum.UNAVAILABILE) {
            this.openTime = null;
            this.closeTime = null;
        }
    }
}
