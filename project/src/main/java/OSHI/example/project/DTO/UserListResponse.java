package OSHI.example.project.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserListResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean enabled;
    private boolean accountNonLocked;
    private LocalDateTime lastActiveTimestamp;
}
