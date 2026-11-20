package com.tinyarcade;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.admin.AdminUserRepository;
import com.tinyarcade.repository.user.UserRepository;
import com.tinyarcade.service.admin.AdminUserService;
import com.tinyarcade.service.auth.MockAccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AdminPromotionTests {
    @Autowired AdminUserService adminUserService;
    @Autowired UserRepository userRepository;
    @Autowired AdminUserRepository adminUserRepository;
    @Autowired MockAccountService mockAccountService;

    private User createMember() {
        return userRepository.saveAndFlush(User.signUp("promotion@example.com", "test-hash", "승격테스트"));
    }

    @Test
    void promotionRetiresMockAdminAndRestoresMockMemberInSameTransaction() {
        Long adminId = userRepository.findByEmail("admin").orElseThrow().getId();
        User member = createMember();
        mockAccountService.syncMockAccounts();

        var response = adminUserService.promoteToAdmin(member.getId());

        assertEquals(UserRole.ADMIN, response.role());
        assertEquals(UserStatus.WITHDRAWN, userRepository.findById(adminId).orElseThrow().getStatus());
        User mockMember = userRepository.findByEmail("user").orElseThrow();
        assertTrue(mockMember.isMock());
        assertEquals(UserStatus.ACTIVE, mockMember.getStatus());
    }

    @Test
    void mockMemberCannotBePromoted() {
        User mock = userRepository.findByEmail("user").orElseThrow();
        BusinessException error = assertThrows(BusinessException.class,
                () -> adminUserService.promoteToAdmin(mock.getId()));
        assertEquals(ErrorCode.VALIDATION_ERROR, error.getErrorCode());
    }

    @Test
    void suspendedMemberCannotBePromoted() {
        User member = createMember();
        adminUserRepository.updateStatus(member.getId(), UserStatus.SUSPENDED);
        BusinessException error = assertThrows(BusinessException.class,
                () -> adminUserService.promoteToAdmin(member.getId()));
        assertEquals(ErrorCode.VALIDATION_ERROR, error.getErrorCode());
    }

    @Test
    void withdrawnMemberCannotBePromoted() {
        User member = createMember();
        adminUserRepository.updateStatus(member.getId(), UserStatus.WITHDRAWN);
        BusinessException error = assertThrows(BusinessException.class,
                () -> adminUserService.promoteToAdmin(member.getId()));
        assertEquals(ErrorCode.VALIDATION_ERROR, error.getErrorCode());
    }

    @Test
    void repeatedPromotionIsRejected() {
        User member = createMember();
        adminUserService.promoteToAdmin(member.getId());
        BusinessException error = assertThrows(BusinessException.class,
                () -> adminUserService.promoteToAdmin(member.getId()));
        assertEquals(ErrorCode.VALIDATION_ERROR, error.getErrorCode());
    }
}
