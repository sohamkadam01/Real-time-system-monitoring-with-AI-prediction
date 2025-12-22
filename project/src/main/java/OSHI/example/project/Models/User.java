package OSHI.example.project.Models;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_data")
public class User {
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
    
    @Column(nullable = false)
    private boolean enabled = true;
    
    @Column(nullable = false)
    private boolean accountNonExpired = true;
    
    @Column(nullable = false)
    private boolean accountNonLocked = true;
    
    @Column(nullable = false)
    private boolean credentialsNonExpired = true;
    
    @Column(nullable = false)
    private String role = "ROLE_USER";
    
    public User() {}
    
    public User(String username, String systemname, String email, String password) {
        this.username = username;
        this.systemname = systemname;
        this.email = email;
        this.password = password;
    }
}