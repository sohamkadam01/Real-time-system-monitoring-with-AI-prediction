package OSHI.example.project.Repository;

import OSHI.example.project.Models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Optional<User> findBySystemname(String systemname);

    boolean existsBySystemname(String systemname);

    // ❌ These are not used anymore (password is encoded)
    // Optional<User> findByUsernameAndPassword(String username, String password);
    // Optional<User> findByEmailAndPassword(String email, String password);

    // ✅ REQUIRED for admin safety checks
    long countByRole(String role);
}
