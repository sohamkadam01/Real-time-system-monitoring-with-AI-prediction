package OSHI.example.project.Service;

import OSHI.example.project.Models.User;
import OSHI.example.project.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // -------------------- CONSTANTS --------------------

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_USER = "ROLE_USER";

    // -------------------- REGISTER --------------------

    public User createUser(User user) {

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsBySystemname(user.getSystemname())) {
            throw new RuntimeException("System name already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(ROLE_USER); // default role

        return userRepository.save(user);
    }

    // -------------------- ADMIN METHODS --------------------

    // ✅ Get all users (Admin)
    public List<User> getAllUsersForAdmin() {
        return userRepository.findAll();
    }

    // ✅ Update user role (with safety checks)
    public User updateUserRole(Long adminId, Long targetUserId, String role) {

        validateRole(role);

        User admin = getUserOrThrow(adminId);
        User targetUser = getUserOrThrow(targetUserId);

        // ❌ Prevent self role downgrade
        if (admin.getId().equals(targetUserId) && ROLE_USER.equals(role)) {
            throw new RuntimeException("Admin cannot demote themselves");
        }

        // ❌ Ensure at least one admin remains
        if (isLastAdmin(targetUser) && ROLE_USER.equals(role)) {
            throw new RuntimeException("At least one admin must exist");
        }

        targetUser.setRole(role);
        return userRepository.save(targetUser);
    }

    // ✅ Activate / Deactivate user
    public User toggleUserActivation(Long adminId, Long targetUserId, boolean active) {

        User admin = getUserOrThrow(adminId);
        User targetUser = getUserOrThrow(targetUserId);

        // ❌ Prevent self-deactivation
        if (admin.getId().equals(targetUserId) && !active) {
            throw new RuntimeException("You cannot deactivate your own account");
        }

        // ❌ Prevent deactivating last admin
        if (isLastAdmin(targetUser) && !active) {
            throw new RuntimeException("Cannot deactivate the last admin");
        }

        targetUser.setEnabled(active);
        return userRepository.save(targetUser);
    }

    // ✅ Delete user
    public void deleteUser(Long adminId, Long targetUserId) {

        User admin = getUserOrThrow(adminId);
        User targetUser = getUserOrThrow(targetUserId);

        // ❌ Prevent self-deletion
        if (admin.getId().equals(targetUserId)) {
            throw new RuntimeException("Admin cannot delete themselves");
        }

        // ❌ Prevent deleting last admin
        if (isLastAdmin(targetUser)) {
            throw new RuntimeException("Cannot delete the last admin");
        }

        userRepository.delete(targetUser);
    }

    // -------------------- USER METHODS --------------------

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserBySystemname(String systemname) {
        return userRepository.findBySystemname(systemname);
    }

    public User updateUser(Long id, User userDetails) {

        User user = getUserOrThrow(id);

        if (userDetails.getUsername() != null) {
            user.setUsername(userDetails.getUsername());
        }

        if (userDetails.getSystemname() != null) {
            user.setSystemname(userDetails.getSystemname());
        }

        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }

        if (userDetails.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        return userRepository.save(user);
    }

    // -------------------- AUTHENTICATION --------------------

    public Optional<User> authenticate(String usernameOrEmail, String rawPassword) {

        Optional<User> userOpt =
                userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

        if (userOpt.isEmpty()) return Optional.empty();

        User user = userOpt.get();

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return Optional.empty();
        }

        // 🕒 Update last active
        user.setLastActiveTimestamp(LocalDateTime.now());
        userRepository.save(user);

        return Optional.of(user);
    }

    public boolean userExists(String usernameOrEmail) {
        return userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail).isPresent();
    }

    public User changePassword(Long userId, String oldPassword, String newPassword) {

        User user = getUserOrThrow(userId);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Invalid old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    // -------------------- HELPER METHODS --------------------

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isLastAdmin(User user) {
        if (!ROLE_ADMIN.equals(user.getRole())) {
            return false;
        }
        return userRepository.countByRole(ROLE_ADMIN) <= 1;
    }

    private void validateRole(String role) {
        if (!ROLE_ADMIN.equals(role) && !ROLE_USER.equals(role)) {
            throw new RuntimeException("Invalid role: " + role);
        }
    }
}
