package com.appointments.booking.appointments.model.patner;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "off_time")
public class OffTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long offTimeId;

    @JsonFormat(pattern = "HH:mm")
    @Column(name = "off_time_from", nullable = false, columnDefinition = "TIME")
    private LocalTime offTimeFrom;

    @JsonFormat(pattern = "HH:mm")
    @Column(name = "off_time_to", nullable = false, columnDefinition = "TIME")
    private LocalTime offTimeTo;

    @ManyToOne
    @JoinColumn(name = "availability_id", nullable = false)
    @JsonBackReference
    private Availability availability;
}
