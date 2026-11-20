package com.tinyarcade.service.admin;

import com.tinyarcade.dto.admin.AdminUserResponse;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.admin.AdminUserRepository;
import com.tinyarcade.service.auth.MockAccountService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 유저 관리 업무 규칙 (24번 유저 관리, 허 담당).
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final MockAccountService mockAccountService;

    /** 전체 유저 목록 조회 (최근 가입순) */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        return adminUserRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    /** 관리자 지정과 목계정 동기화를 같은 트랜잭션에서 처리한다. */
    @Transactional
    public AdminUserResponse promoteToAdmin(Long userId) {
        User user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (user.isMock() || user.getStatus() != UserStatus.ACTIVE || user.getRole() != UserRole.USER) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "활성 상태의 실제 일반 회원만 관리자로 지정할 수 있습니다.");
        }
        if (adminUserRepository.promoteActiveMember(userId) != 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "회원 상태가 변경되었습니다. 목록을 새로 확인해 주세요.");
        }
        mockAccountService.syncMockAccounts();
        User promoted = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return AdminUserResponse.from(promoted);
    }

    /** 유저 정지 (ACTIVE -> SUSPENDED) */
    @Transactional
    public AdminUserResponse suspendUser(Long userId) {
        User user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // 관리자 계정은 정지 불가 (자기 자신 포함) -> FORBIDDEN
        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        // 탈퇴(WITHDRAWN) 유저 또는 이미 정지(SUSPENDED) 상태면 VALIDATION_ERROR
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        adminUserRepository.updateStatus(userId, UserStatus.SUSPENDED);
        User updated = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return AdminUserResponse.from(updated);
    }

    /** 유저 정지 해제 (SUSPENDED -> ACTIVE) */
    @Transactional
    public AdminUserResponse activateUser(Long userId) {
        User user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // 탈퇴(WITHDRAWN) 유저 또는 이미 활성(ACTIVE) 상태면 VALIDATION_ERROR
        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        adminUserRepository.updateStatus(userId, UserStatus.ACTIVE);
        User updated = adminUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return AdminUserResponse.from(updated);
    }
}
