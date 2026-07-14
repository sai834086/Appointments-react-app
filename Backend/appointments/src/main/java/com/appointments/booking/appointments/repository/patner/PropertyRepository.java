package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    Property findByPropertyName(String propertyName);

    // Path: Property -> partnerUser -> appUser -> userId
    List<Property> findByPartnerUser_AppUser_UserId(Long ownerId);

    // Path: Property -> partnerUser -> partnerId
    long countByPartnerUser_PartnerId(Long partnerId);

    // Dashboard breakdown: properties by status within a partner's portfolio
    long countByPartnerUser_PartnerIdAndStatus(Long partnerId, StatusEnum status);

    // Path: Property -> partnerUser -> appUser -> userId
    Optional<Property> findByPropertyIdAndPartnerUser_AppUser_UserId(Long propertyId, Long userId);

    // Path: Property -> manager -> userId
    Optional<Property> findByManager_UserId(Long userId);

    // Authorization check shared by property-scoped read endpoints (employees,
    // services, etc). A given propertyId is accessible to a userId when that
    // user is EITHER the partner who owns the property OR the manager
    // assigned to it — not just the owning partner. Endpoints that only
    // checked partner ownership were silently returning empty results for
    // managers even when the propertyId was correct.
    //
    // NOTE: receptionists are intentionally excluded here — they're a
    // read-only, appointments-only role and should not gain access to
    // employees/services endpoints that use this check. See
    // findByPropertyIdAuthorizedForAppointments for the wider check used by
    // the appointments endpoint, which does include receptionists.
    @Query("SELECT p FROM Property p WHERE p.propertyId = :propertyId " +
            "AND (p.partnerUser.appUser.userId = :userId OR p.manager.userId = :userId)")
    Optional<Property> findByPropertyIdAuthorizedForUser(@Param("propertyId") Long propertyId,
                                                           @Param("userId") Long userId);

    // Authorization check for the appointments endpoint specifically: partner
    // owner, assigned manager, OR any one of the property's assigned
    // receptionists may view a property's appointments. A property can have
    // many receptionists (see AppUser.receptionistProperty), so this joins
    // against the collection rather than comparing a single FK.
    @Query("SELECT DISTINCT p FROM Property p LEFT JOIN p.receptionists r " +
            "WHERE p.propertyId = :propertyId " +
            "AND (p.partnerUser.appUser.userId = :userId OR p.manager.userId = :userId " +
            "OR r.userId = :userId)")
    Optional<Property> findByPropertyIdAuthorizedForAppointments(@Param("propertyId") Long propertyId,
                                                                    @Param("userId") Long userId);
}