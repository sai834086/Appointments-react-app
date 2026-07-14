package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.InvalidException;
import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.mapStruct.patner.OffTimeMapStruct;
import com.appointments.booking.appointments.model.patner.Availability;
import com.appointments.booking.appointments.model.patner.OffTime;
import com.appointments.booking.appointments.payload.request.patner.offTimeRequest.OffTimeRegisterRequest;
import com.appointments.booking.appointments.payload.response.patner.offTimeResponse.GetAllOffTimeResponse;
import com.appointments.booking.appointments.repository.patner.AvailabilityRepository;
import com.appointments.booking.appointments.repository.patner.OffTimeRepository;
import com.appointments.booking.appointments.service.patner.OffTimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class OffTimeServiceImpl implements OffTimeService {

    private final AvailabilityRepository availabilityRepository;
    private final OffTimeRepository offTimeRepository;
    private final OffTimeMapStruct offTimeMapStruct;

    @Autowired
    public OffTimeServiceImpl(AvailabilityRepository availabilityRepository,
                              OffTimeRepository offTimeRepository,
                              OffTimeMapStruct offTimeMapStruct) {
        this.availabilityRepository = availabilityRepository;
        this.offTimeRepository = offTimeRepository;
        this.offTimeMapStruct = offTimeMapStruct;
    }

    @Override
    @Transactional
    public void registerOffTimeRequest(OffTimeRegisterRequest dto, Long userId, Long availabilityId) {

        // UPDATED: Securely fetch using the PartnerUser -> AppUser path
        Availability availability = availabilityRepository.findByAvailabilityIdAndEmployee_Property_partnerUser_appUser_UserId(availabilityId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Unauthorized or availability not found"));

        if (!validateOffTime(availability, dto.getOffTimeFrom(), dto.getOffTimeTo())) {
            throw new InvalidException("Off time must be within working hours and To must be after From");
        }

        OffTime offTime = offTimeMapStruct.toEntity(dto);
        offTime.setAvailability(availability);
        offTimeRepository.save(offTime);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GetAllOffTimeResponse> getAllOffTime(Long availabilityId, Long userId) {

        // UPDATED: Securely fetch using the PartnerUser -> AppUser path
        List<OffTime> allOffTime = offTimeRepository
                .findByAvailability_AvailabilityIdAndAvailability_Employee_Property_partnerUser_appUser_UserId(availabilityId, userId)
                .orElseThrow(()-> new UnauthorizedAccessOrUnknownException("Unauthorized or off times not found"));

        return allOffTime.stream()
                .map(offTimeMapStruct::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteOffTime(Long userId, Long offTimeId) {

        // UPDATED: Securely fetch using the PartnerUser -> AppUser path
        OffTime offTime = offTimeRepository.findByOffTimeIdAndAvailability_Employee_Property_partnerUser_appUser_UserId(offTimeId, userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("OffTime not found or unauthorized"));

        offTimeRepository.delete(offTime);
    }

    public boolean validateOffTime(Availability availability, LocalTime offTimeFrom, LocalTime offTimeTo){
        LocalTime openTime = availability.getOpenTime();
        LocalTime closeTime = availability.getCloseTime();

        boolean withinOpenClose =
                (offTimeFrom.isAfter(openTime) || offTimeFrom.equals(openTime)) &&
                        (offTimeTo.isBefore(closeTime) || offTimeTo.equals(closeTime));

        boolean validOrder = offTimeTo.isAfter(offTimeFrom);

        return withinOpenClose && validOrder;
    }
}