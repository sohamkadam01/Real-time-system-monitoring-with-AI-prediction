package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class UserRegisterRequest {
    private String username;
    private String systemname;
    private String email;
    private String password;

    // Optional: if not provided, default to ROLE_USER
    private String role;
}
