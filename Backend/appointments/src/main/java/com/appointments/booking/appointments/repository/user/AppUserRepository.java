package com.appointments.booking.appointments.repository.user;

import com.appointments.booking.appointments.model.appuser.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser,Long> {
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    Optional<AppUser> findByEmailOrPhoneNumber(String email, String phoneNumber);
    Optional<AppUser> findByEmail(String email);

    // Scoped lookup used to edit/remove one specific receptionist: confirms
    // the receptionist (by userId) is actually assigned to the given
    // property before letting a caller mutate them, so a partner/manager of
    // one property can't touch a receptionist belonging to another.
    Optional<AppUser> findByUserIdAndReceptionistProperty_PropertyId(Long userId, Long propertyId);

    // Email verification lookup — token is unique, so this is safe to use
    // directly rather than a scoped query.
    Optional<AppUser> findByVerificationToken(String token);

}
