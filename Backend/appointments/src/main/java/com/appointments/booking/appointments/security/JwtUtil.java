package com.appointments.booking.appointments.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.validity}")
    private long validity; // in milliseconds

    // Generate JWT with roles
    public String generateToken(UserDetails userDetails, Long id) {
        // Strip the "ROLE_" prefix before storing in the token.
        // JwtUserDetails.getAuthorities() adds it back on read, so storing the
        // raw name (e.g. "USER") prevents double-prefixing ("ROLE_ROLE_USER").
        List<String> roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .toList();
        return generateToken(userDetails.getUsername(), roles, id);
    }

    public String generateToken(String username, List<String> roles, Long id) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", roles)
                .claim("id", id)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + validity))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Long extractId(String token) {
        // We use a specific function to pull out the "id" claim safely
        return extractClaim(token, claims -> claims.get("id", Long.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 2. The method that parses the token body
    private Claims extractAllClaims(String token) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes()); // Use your same secret key logic here
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}














