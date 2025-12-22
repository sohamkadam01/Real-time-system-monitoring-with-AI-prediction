package OSHI.example.project.JWT; // Keep your original package name

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // At least 32+ characters for HS256 (256 bits)
    private static final String SECRET_KEY = "soham_super_secure_jwt_secret_key_1234567890987654321";
    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1 hour
    private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7 days

    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // Generate access token
    public String generateToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("tokenType", "access");
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Generate refresh token
    public String generateRefreshToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("tokenType", "refresh");
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Extract username from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract user ID from token
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    // Extract expiration date from token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Generic method to extract a claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extract all claims from token
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            // Token expired but we can still extract claims for logging
            return e.getClaims();
        } catch (JwtException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    // Check if token is expired
    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    // Validate token with UserDetails
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Validate token without UserDetails
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return !isTokenExpired(token);
        } catch (ExpiredJwtException e) {
            return false; // Token expired
        } catch (JwtException | IllegalArgumentException e) {
            return false; // Invalid token
        }
    }

    // Check if token is a refresh token
    public boolean isRefreshToken(String token) {
        try {
            String tokenType = extractClaim(token, claims -> claims.get("tokenType", String.class));
            return "refresh".equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    // Check if token is an access token
    public boolean isAccessToken(String token) {
        try {
            String tokenType = extractClaim(token, claims -> claims.get("tokenType", String.class));
            return "access".equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    // Refresh access token using refresh token
    public String refreshAccessToken(String refreshToken) {
        if (!validateToken(refreshToken) || !isRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }
        
        Long userId = extractUserId(refreshToken);
        String username = extractUsername(refreshToken);
        
        return generateToken(userId, username);
    }

    // Get remaining time until token expiration in milliseconds
    public long getRemainingTime(String token) {
        try {
            Date expiration = extractExpiration(token);
            Date now = new Date();
            return expiration.getTime() - now.getTime();
        } catch (Exception e) {
            return 0L;
        }
    }

    // Check if token is about to expire (within specified minutes)
    public boolean isTokenAboutToExpire(String token, int minutesBefore) {
        long remainingTime = getRemainingTime(token);
        return remainingTime > 0 && remainingTime < (minutesBefore * 60 * 1000);
    }

    // Validate token with username (alternative to UserDetails)
    public boolean validateToken(String token, String username) {
        final String tokenUsername = extractUsername(token);
        return (username.equals(tokenUsername) && !isTokenExpired(token));
    }

    // Extract all claims as map for debugging
    public Map<String, Object> getAllClaims(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Map<String, Object> claimsMap = new HashMap<>();
            claims.forEach(claimsMap::put);
            return claimsMap;
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}