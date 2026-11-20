package com.tinyarcade.entity.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.entity.user.UserRole;

/**
 * 게시판별 아티클·댓글 작성 권한 단계.
 * ANONYMOUS(비로그인) -> USER(사용자) -> ADMIN(관리자)
 */
public enum BoardWriteRole {
    ANONYMOUS,
    USER,
    ADMIN;

    public boolean allows(LoginUser loginUser) {
        return switch (this) {
            case ANONYMOUS -> true;
            case USER -> loginUser != null;
            case ADMIN -> loginUser != null && loginUser.role() == UserRole.ADMIN;
        };
    }
}
