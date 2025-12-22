package OSHI.example.project.Mapper;

import OSHI.example.project.DTO.UserRegisterRequest;
import OSHI.example.project.DTO.UserResponse;
import OSHI.example.project.Models.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // Register DTO → Entity
    public User toEntity(UserRegisterRequest dto, String encodedPassword) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setSystemname(dto.getSystemname());
        user.setEmail(dto.getEmail());
        user.setPassword(encodedPassword);
        user.setRole("ROLE_USER"); // default
        return user;
    }

    // Entity → Response DTO
    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getSystemname(),
                user.getEmail(),
                user.getRole()
        );
    }
}
