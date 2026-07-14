package com.appointments.booking.appointments.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = UniquePhoneNumberValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface UniquePhoneNumber {
    String message() default "Phone Number already exists";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    // REMOVED: Class<?> entity();
}