package com.tinyarcade.repository.user;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    long countByRoleAndMockFalseAndStatusNot(UserRole role, UserStatus status);

    List<User> findByRoleAndMockTrueAndStatusNot(UserRole role, UserStatus status);
}
