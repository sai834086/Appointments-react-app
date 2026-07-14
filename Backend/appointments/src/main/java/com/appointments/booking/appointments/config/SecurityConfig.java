package com.appointments.booking.appointments.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // 1. Password Encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Authentication Provider (FIXED)
    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService, // Spring automatically finds your Service
            PasswordEncoder passwordEncoder
    ) {
        // FIX: Use no-arg constructor
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

        // FIX: Set dependencies manually
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    // 3. Authentication Manager (Standard Spring Boot Way)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        // This automatically uses the Provider defined above
        return config.getAuthenticationManager();
    }
}
