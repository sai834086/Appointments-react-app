package com.appointments.booking.appointments.validation;

import com.appointments.booking.appointments.repository.user.AppUserRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    @Autowired
    private AppUserRepository appUserRepository;

    @Override
    public void initialize(UniqueEmail constraintAnnotation) {
        // We ignore the 'entity' parameter now.
        // In Single Table Architecture, ALL login emails must be unique in the AppUser table.
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        // 1. Handle nulls (Let @NotBlank handle empty checks)
        if (email == null || email.isEmpty()) {
            return true;
        }

        // 2. Global Check
        // If this email exists anywhere in the AppUser table, it is invalid.
        return !appUserRepository.existsByEmail(email);
    }
}