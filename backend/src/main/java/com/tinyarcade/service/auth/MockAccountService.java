package com.tinyarcade.service.auth;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.repository.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 초기 목계정(admin / user) 자동가입·자동탈퇴 관리 서비스.
 * 실제 ADMIN/USER 계정 수에 따라 각 권한을 독립적으로 동기화한다.
 */
@Service
@RequiredArgsConstructor
public class MockAccountService {

    private static final String MOCK_PASSWORD = "1234";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void syncMockAccounts() {
        syncRole(UserRole.ADMIN, "admin");
        syncRole(UserRole.USER, "user");
    }

    private void syncRole(UserRole role, String identifier) {
        long realCount = userRepository.countByRoleAndMockFalseAndStatusNot(role, UserStatus.WITHDRAWN);
        List<User> activeMocks = userRepository.findByRoleAndMockTrueAndStatusNot(role, UserStatus.WITHDRAWN);

        if (realCount == 0) {
            if (activeMocks.isEmpty()) {
                userRepository.saveAndFlush(User.createMock(
                        identifier,
                        passwordEncoder.encode(MOCK_PASSWORD),
                        identifier,
                        role
                ));
            }
        } else if (!activeMocks.isEmpty()) {
            activeMocks.forEach(User::withdrawMock);
            userRepository.saveAllAndFlush(activeMocks);
        }
    }
}
