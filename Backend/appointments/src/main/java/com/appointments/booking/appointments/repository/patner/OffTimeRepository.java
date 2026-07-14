package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.patner.OffTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OffTimeRepository extends JpaRepository<OffTime, Long> {

    // 🔄 FIXED: Path updated to traverse through partnerUser
    // Path: OffTime -> Availability -> Employee -> Property -> partnerUser -> appUser -> userId
    Optional<List<OffTime>> findByAvailability_AvailabilityIdAndAvailability_Employee_Property_partnerUser_appUser_UserId(
            Long availabilityId,
            Long ownerId
    );

    // 🔄 FIXED: Path updated to traverse through partnerUser
    Optional<OffTime> findByOffTimeIdAndAvailability_Employee_Property_partnerUser_appUser_UserId(
            Long offTimeId,
            Long ownerId
    );
}