package com.security.spring_security.Config;

import com.security.spring_security.Model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @org.springframework.beans.factory.annotation.Value("${jwt.secret:}")
    private String secret;
    
    private Key defaultKey;

    // Access Token valid for 15 minutes
    private static final long ACCESS_TOKEN_VALIDITY = 15 * 60 * 1000;
    
    // Refresh Token valid for 7 days
    private static final long REFRESH_TOKEN_VALIDITY = 7L * 24 * 60 * 60 * 1000;
    
    private Key getSigningKey() {
        if (secret == null || secret.isBlank()) {
            if (defaultKey == null) {
                defaultKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            }
            return defaultKey;
        }
        return Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(User user) {
        return createToken(user, ACCESS_TOKEN_VALIDITY);
    }
    
    public String generateRefreshToken(User user) {
        return createToken(user, REFRESH_TOKEN_VALIDITY);
    }

    private String createToken(User user, long validity) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tokenVersion", user.getTokenVersion());
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + validity))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public int extractTokenVersion(String token) {
        Integer tokenVersion = extractAllClaims(token).get("tokenVersion", Integer.class);
        if (tokenVersion == null) {
            throw new IllegalArgumentException("Token version is missing");
        }
        return tokenVersion;
    }

    public Boolean validateToken(String token, String email, int currentTokenVersion) {
        final String extractedEmail = extractEmail(token);
        return extractedEmail.equals(email)
                && extractTokenVersion(token) == currentTokenVersion
                && !isTokenExpired(token);
    }
}
