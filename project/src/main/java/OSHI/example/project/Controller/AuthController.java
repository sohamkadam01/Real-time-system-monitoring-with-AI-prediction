package OSHI.example.project.Controller;

import OSHI.example.project.DTO.UserLoginRequest;
import OSHI.example.project.DTO.UserRegisterRequest;
import OSHI.example.project.DTO.UserResponse;
import OSHI.example.project.JWT.JwtUtil;
import OSHI.example.project.Models.User;
import OSHI.example.project.Service.UserService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // ------------------- REGISTER -------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid UserRegisterRequest request) {

        // Default role if not provided
        String role = request.getRole() != null ? request.getRole() : "ROLE_USER";

        User user = new User(
                request.getUsername(),
                request.getSystemname(),
                request.getEmail(),
                request.getPassword()
        );

        user.setRole(role); // set role before saving

        // Create user
        User createdUser = userService.createUser(user);

        // Generate JWT including role
        String token = jwtUtil.generateToken(
                createdUser.getId(),
                createdUser.getUsername(),
                createdUser.getRole()
        );

        UserResponse userResponse = new UserResponse(
                createdUser.getId(),
                createdUser.getUsername(),
                createdUser.getSystemname(),
                createdUser.getEmail(),
                createdUser.getRole()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("user", userResponse);
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ------------------- LOGIN -------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid UserLoginRequest request) {

        Optional<User> userOpt =
                userService.authenticate(request.getUsername(), request.getPassword());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();

        // Generate JWT including role
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole()
        );

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getSystemname(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "user", userResponse
        ));
    }
}
