package OSHI.example.project.Service;

import OSHI.example.project.DTO.UserAdminResponse;
import OSHI.example.project.DTO.UserListResponse;
import OSHI.example.project.DTO.UserUpdateRequest;
import OSHI.example.project.Models.User;
import OSHI.example.project.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserListResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToUserListResponse)
                .collect(Collectors.toList());
    }

    public UserAdminResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToUserAdminResponse(user);
    }

    public UserAdminResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (request.getRole() != null) {
            validateRole(request.getRole());
            user.setRole(request.getRole());
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        if (request.getAccountNonLocked() != null) {
            user.setAccountNonLocked(request.getAccountNonLocked());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserAdminResponse(updatedUser);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalStateException("Cannot delete ADMIN user");
        }

        userRepository.delete(user);
    }

    public UserAdminResponse toggleUserActivation(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        user.setEnabled(active);
        User updatedUser = userRepository.save(user);
        return mapToUserAdminResponse(updatedUser);
    }

    private void validateRole(String role) {
        if (!role.equals("ADMIN") && !role.equals("USER")) {
            throw new IllegalArgumentException("Invalid role. Must be 'ADMIN' or 'USER'");
        }
    }

    private UserListResponse mapToUserListResponse(User user) {
        UserListResponse dto = new UserListResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setEnabled(user.isEnabled());
        dto.setAccountNonLocked(user.isAccountNonLocked());
        dto.setLastActiveTimestamp(user.getLastActiveTimestamp());
        return dto;
    }

    private UserAdminResponse mapToUserAdminResponse(User user) {
        UserAdminResponse dto = new UserAdminResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setSystemname(user.getSystemname());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setEnabled(user.isEnabled());
        dto.setAccountNonExpired(user.isAccountNonExpired());
        dto.setAccountNonLocked(user.isAccountNonLocked());
        dto.setCredentialsNonExpired(user.isCredentialsNonExpired());
        dto.setLastActiveTimestamp(user.getLastActiveTimestamp());
        return dto;
    }
}