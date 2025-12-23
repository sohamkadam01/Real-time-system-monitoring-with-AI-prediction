package OSHI.example.project.Controller;

import OSHI.example.project.DTO.UserLoginRequest;
import OSHI.example.project.DTO.UserRegisterRequest;
import OSHI.example.project.DTO.UserResponse;
import OSHI.example.project.JWT.JwtUtil;
import OSHI.example.project.Mapper.UserMapper;
import OSHI.example.project.Models.User;
import OSHI.example.project.Service.UserService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
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


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterRequest request) {

        User user = new User(
                request.getUsername(),
                request.getSystemname(),
                request.getEmail(),
                request.getPassword()
        );

        User createdUser = userService.createUser(user);

        String token = jwtUtil.generateToken(
                createdUser.getId(),
                createdUser.getUsername()
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

    // ✅ LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginRequest request) {

        Optional<User> userOpt =
                userService.authenticate(request.getUsername(), request.getPassword());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

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
