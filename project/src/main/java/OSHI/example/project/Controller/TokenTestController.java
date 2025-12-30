package OSHI.example.project.Controller;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/test")
public class TokenTestController {
    
    private final String SECRET_KEY = "your-secret-key-at-least-256-bits-long-here";
    
    @PostMapping("/decode")
    public String decodeToken(@RequestBody String token) {
        try {
            // Remove "Bearer " prefix if present
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            // Decode to see structure
            String[] parts = token.split("\\.");
            String header = new String(Base64.getDecoder().decode(parts[0]));
            String payload = new String(Base64.getDecoder().decode(parts[1]));
            
            return "Header: " + header + "\n\nPayload: " + payload;
            
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }
}