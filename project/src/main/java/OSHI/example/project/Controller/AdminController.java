package OSHI.example.project.Controller;

import OSHI.example.project.DTO.UserAdminResponse;
import OSHI.example.project.DTO.UserListResponse;
import OSHI.example.project.DTO.UserUpdateRequest;
import OSHI.example.project.Service.AdminUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUserService adminUserService;

    public AdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserListResponse>> getAllUsers() {
        List<UserListResponse> users = adminUserService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAdminResponse> getUserById(@PathVariable Long id) {
        UserAdminResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAdminResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request) {
        UserAdminResponse updatedUser = adminUserService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserAdminResponse> activateUser(
            @PathVariable Long id,
            @RequestParam boolean active) {
        UserAdminResponse updatedUser = adminUserService.toggleUserActivation(id, active);
        return ResponseEntity.ok(updatedUser);
    }

    // Exception handling for better API responses
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
}