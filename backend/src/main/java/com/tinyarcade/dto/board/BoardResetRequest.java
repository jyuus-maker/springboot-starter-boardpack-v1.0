package com.tinyarcade.dto.board;

import jakarta.validation.constraints.NotNull;

/**
 * 관리자 게시판 초기화 요청 DTO.
 */
public record BoardResetRequest(
        @NotNull(message = "초기화 방식을 선택해 주세요.")
        ResetMode mode
) {
    public enum ResetMode {
        ALL,
        COMMENTS_ONLY
    }
}
