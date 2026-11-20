package com.tinyarcade.dto.board;

/**
 * 비로그인 게시글 삭제 시 비밀번호 확인 요청 본문.
 */
public record GuestPasswordRequest(String guestPassword) {
    public GuestPasswordRequest {
        if (guestPassword != null) guestPassword = guestPassword.trim();
    }
}
