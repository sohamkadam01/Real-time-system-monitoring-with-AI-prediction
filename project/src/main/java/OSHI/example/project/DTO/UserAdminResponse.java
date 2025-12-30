package OSHI.example.project.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserAdminResponse {

    private Long id;
    private String username;
    private String systemname;
    private String email;

    private String role;

    private boolean enabled;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean credentialsNonExpired;

    private LocalDateTime lastActiveTimestamp;
}
