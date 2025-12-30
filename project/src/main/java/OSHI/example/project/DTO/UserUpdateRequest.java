package OSHI.example.project.DTO;

import lombok.Data;

@Data
public class UserUpdateRequest {

    // Change role: ROLE_USER or ROLE_ADMIN
    private String role;

    // Enable / Disable user
    private Boolean enabled;

    // Lock / Unlock account
    private Boolean accountNonLocked;

}
