package com.appointments.booking.appointments.validation;

import com.appointments.booking.appointments.repository.user.AppUserRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class UniquePhoneNumberValidator implements ConstraintValidator<UniquePhoneNumber, String> {

    @Autowired
    private AppUserRepository appUserRepository;

    @Override
    public void initialize(UniquePhoneNumber constraintAnnotation) {
        // No initialization needed anymore
    }

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        // 1. Handle null/empty (Let @NotBlank or @Pattern handle format)
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return true;
        }

        // 2. Global Check: Phone must be unique across the entire AppUser table
        return !appUserRepository.existsByPhoneNumber(phoneNumber);
    }
}