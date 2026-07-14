package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.patner.Services;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServicesRepository extends JpaRepository<Services, Long> {

    @Query("SELECT UPPER(s.serviceName) FROM Services s WHERE s.property.propertyId = :propertyId")
    List<String> findByServiceNamesWithPropertyId(@Param("propertyId") Long propertyId);

    // FIXED: Path includes partnerUser
    Optional<Services> findByServiceIdAndProperty_partnerUser_appUser_UserId(Long serviceId, Long userId);

    // FIXED: Path includes partnerUser
    Optional<List<Services>> findByProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(Long propertyId, Long userId);

    List<Services> findByServiceIdInAndProperty_PropertyId(List<Long> serviceIds, Long propertyId);

    // Safe: propertyId-only lookup, used once the caller has already been
    // authorized against the property (partner OR assigned manager) via
    // PropertyRepository#findByPropertyIdAuthorizedForUser.
    List<Services> findByProperty_PropertyId(Long propertyId);

    // FIXED QUERY: Join path updated to p.partnerUser.appUser
    @Query("""
        SELECT s FROM Services s 
        JOIN s.employees e 
        WHERE e.employeeId = :employeeId 
          AND e.property.partnerUser.appUser.userId = :appUserId
    """)
    List<Services> findServicesByEmployeeId(@Param("employeeId") Long employeeId,
                                            @Param("appUserId") Long appUserId);

    // FIXED: Path includes partnerUser
    Optional<Services> findByServiceIdAndProperty_PropertyIdAndProperty_partnerUser_appUser_UserId(
            Long serviceId, Long propertyId, Long userId
    );

    Optional<Services> findByServiceIdAndProperty_PropertyId(Long serviceId, Long propertyId);

    // FIXED QUERY: Join path updated
    @Query("SELECT s FROM Services s WHERE s.property.partnerUser.appUser.userId = :userId")
    List<Services> findAllByOwnerId(@Param("userId") Long userId);


    List<Services> findByProperty_PartnerUser_PartnerId(Long partnerId);

    long countByProperty_PartnerUser_PartnerId(Long partnerId);

    // Dashboard breakdown: services with at least one employee offering
    // them ("in use" = ACTIVE). Derived from the link itself so the count
    // is correct even for legacy rows whose status column is NULL.
    @Query("""
        SELECT COUNT(DISTINCT s.serviceId) FROM Services s
        JOIN s.employees e
        WHERE s.property.partnerUser.partnerId = :partnerId
    """)
    long countInUseByPartnerId(@Param("partnerId") Long partnerId);
}