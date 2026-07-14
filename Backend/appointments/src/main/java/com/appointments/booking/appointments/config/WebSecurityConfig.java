package com.appointments.booking.appointments.config;

import com.appointments.booking.appointments.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/registerUser").permitAll()
                        .requestMatchers(HttpMethod.POST,"/appointments/loginUser").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/appUser/login").permitAll()
                        .requestMatchers(HttpMethod.POST,"/appointments/partnerUser/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/partnerUser/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/manager/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/receptionist/login").permitAll()
                        // Public, pre-authentication flows: signup email/phone OTP,
                        // email verification links, login OTP verification, and the
                        // forgot-password sequence. These run before a JWT exists,
                        // so they must be permitted or Spring Security returns 403.
                        .requestMatchers("/appointments/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/appointments/partnerUser/login/verify-otp").permitAll()
                        .requestMatchers("/appointments/partnerUser/forgot-password/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH,"/appointments/partnerUser/**").hasRole("PARTNER")
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("https://timesetandbook.com","http://localhost:5173","http://localhost:5174","https://main.d294nkamhkambc.amplifyapp.com","https://occasion-descending-nail-crucial.trycloudflare.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT","PATCH","DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}