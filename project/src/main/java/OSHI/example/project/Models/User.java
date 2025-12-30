// 1 process for admin
package OSHI.example.project.Models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "user_data")
public class User {

    // 🔐 Role constants
    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String systemname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    // 🔹 Account status flags
    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private boolean accountNonExpired = true;

    @Column(nullable = false)
    private boolean accountNonLocked = true;

    @Column(nullable = false)
    private boolean credentialsNonExpired = true;

    // 🔐 Role (ADMIN / USER)
    @Column(nullable = false)
    private String role = ROLE_USER;

    // 🕒 Last active / login timestamp
    @Column(name = "last_active_timestamp")
    private LocalDateTime lastActiveTimestamp;

    // 🔹 Helper method for RBAC checks
    public boolean isAdmin() {
        return ROLE_ADMIN.equals(this.role);
    }

    // 🔹 Constructors
    public User() {}

    public User(String username, String systemname, String email, String password) {
        this.username = username;
        this.systemname = systemname;
        this.email = email;
        this.password = password;
        this.role = ROLE_USER;
        this.enabled = true;
        this.lastActiveTimestamp = LocalDateTime.now();
    }
}
