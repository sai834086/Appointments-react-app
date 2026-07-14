package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.Employee;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // 1. Fetch specific employee securely checking ownership
    // Path: Employee -> Property -> partnerUser -> appUser -> userId
    Optional<Employee> findByEmployeeIdAndProperty_partnerUser_appUser_UserId(Long id, Long userId);

    // 2. Fetch all employees for a specific property securely
    Optional<List<Employee>> findByProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
            Long propertyId,
            Long ownerId
    );

    // 3. Fetch ALL employees belonging to a user (across all their properties)
    List<Employee> findByProperty_partnerUser_appUser_UserId(Long ownerId);

    // 4. Fetch specific employee in specific property securely
    Optional<Employee> findByEmployeeIdAndProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
            Long employeeId, Long propertyId, Long ownerId
    );

    // 5. Lookup by Service ID and Property ID (Safe, no appUser needed)
    List<Employee> findByServices_ServiceIdAndProperty_PropertyId(Long serviceId, Long propertyId);

    // 6. Standard lookup by property ID (Safe)
    List<Employee> findByProperty_propertyId(Long propertyId);

    // 7. Full Name Query (Updated to use .propertyId instead of .id if that's your field name)
    @Query("SELECT CONCAT(e.firstName, ' ', e.lastName) FROM Employee e WHERE e.property.propertyId = :propertyId")
    List<String> fullName(@Param("propertyId") Long propertyId);

    // 8. Fetch by ID with availability graph (Safe)
    @EntityGraph(attributePaths = {"availability", "availability.offTime"})
    Employee findByEmployeeId(Long employeeId);

    // 9. Custom Query with Fetch Join (Safe)
    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.availability WHERE e.employeeId = :employeeId")
    Employee findEmployeeWithAvailability(@Param("employeeId") Long employeeId);

    // 10. Locking (Safe)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Employee e WHERE e.employeeId = :id")
    Optional<Employee> findByIdWithLock(@Param("id") Long id);

    // 11. Count employees assigned to a specific service
    long countByServices_ServiceId(Long serviceId);

    // 12. Count all employees across every property belonging to a partner
    long countByProperty_PartnerUser_PartnerId(Long partnerId);

    // Dashboard breakdown: employees by status within a partner's portfolio
    long countByProperty_PartnerUser_PartnerIdAndStatus(Long partnerId, StatusEnum status);
}