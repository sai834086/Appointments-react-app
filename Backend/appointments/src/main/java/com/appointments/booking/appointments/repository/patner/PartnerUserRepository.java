package com.appointments.booking.appointments.repository.patner;

import com.appointments.booking.appointments.model.patner.PartnerUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartnerUserRepository extends JpaRepository<PartnerUser, Long> {

    @Query("SELECT u FROM PartnerUser u " +
            "WHERE (:country IS NULL OR u.country = :country) " +
            "AND (:state IS NULL OR u.state = :state) " +
            "AND (:city IS NULL OR u.city = :city) " +
            "AND u.isVerified = 'VERIFIED' " +
            "AND u.status = 'ACTIVE'")
    List<PartnerUser> findAllPartnerUsersWithAddress(
            @Param("country") String country,
            @Param("state") String state,
            @Param("city") String city
    );

    boolean existsByBusinessName(String businessName);

    // Path: PartnerUser -> appUser -> userId
    Optional<PartnerUser> findByAppUser_UserId(Long userId);
    boolean existsByPartnerIdAndAppUser_UserId(Long partnerId, Long userId);


}