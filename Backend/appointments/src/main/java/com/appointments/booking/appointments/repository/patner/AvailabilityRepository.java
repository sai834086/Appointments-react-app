package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.enums.AvailabileEnum;
import com.appointments.booking.appointments.model.enums.DayEnum;
import com.appointments.booking.appointments.model.patner.Availability;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    // 🔄 FIXED: Path now includes partnerUser
    // Traversal: Availability -> Employee -> Property -> partnerUser -> appUser -> userId
    Optional<List<Availability>> findByEmployee_EmployeeIdAndEmployee_Property_partnerUser_appUser_UserId(
            Long employeeId,
            Long ownerId
    );

    // 🔄 FIXED: Path now includes partnerUser
    Optional<Availability> findByAvailabilityIdAndEmployee_Property_partnerUser_appUser_UserId(
            Long availabilityId,
            Long ownerId
    );

    // ✅ SAFE: These do not traverse the User path
    boolean existsByEmployee_EmployeeIdAndIsAvailable(Long employeeId, AvailabileEnum isAvailable);

    List<Availability> findByEmployee_employeeId(Long employeeId);

    @EntityGraph(attributePaths = {"offTime"})
    Optional<Availability> findByEmployee_EmployeeIdAndDay(Long employeeId, DayEnum dayEnum);
}