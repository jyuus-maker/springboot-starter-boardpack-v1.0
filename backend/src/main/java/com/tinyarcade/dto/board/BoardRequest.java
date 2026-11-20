package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.BoardWriteRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 관리자 게시판 생성·수정 요청 DTO.
 */
public record BoardRequest(
        @NotBlank(message = "메뉴명을 입력해 주세요.")
        @Size(max = 50, message = "메뉴명은 50자 이하로 입력해 주세요.")
        String menuName,

        @NotBlank(message = "코드명을 입력해 주세요.")
        @Size(min = 2, max = 30, message = "코드명은 2~30자로 입력해 주세요.")
        String code,

        boolean visible,
        boolean adminOnly,

        @NotNull(message = "아티클 작성권한을 선택해 주세요.")
        BoardWriteRole postWriteRole,

        @NotNull(message = "댓글 작성권한을 선택해 주세요.")
        BoardWriteRole commentWriteRole
) {
    public BoardRequest {
        if (menuName != null) menuName = menuName.trim();
        if (code != null) code = code.trim();
    }
}
