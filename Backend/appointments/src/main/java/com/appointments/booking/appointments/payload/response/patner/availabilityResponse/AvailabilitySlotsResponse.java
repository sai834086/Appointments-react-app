package com.appointments.booking.appointments.payload.response.patner.availabilityResponse;

import com.appointments.booking.appointments.payload.projection.AvailabileSlot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlotsResponse {

    private Long employeeId;

    private LocalDate localDate;

    private String day;

    private List<LocalTime> availabileSlots;
}
