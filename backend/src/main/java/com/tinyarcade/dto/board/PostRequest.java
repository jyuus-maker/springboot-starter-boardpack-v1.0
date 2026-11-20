package com.tinyarcade.dto.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 게시글 작성·수정 요청 (동적 게시판 코드 및 비로그인 작성자·비밀번호 지원).
 */
public record PostRequest(
        @NotBlank(message = "게시판을 선택해 주세요.")
        String boardCode,

        @NotBlank(message = "게시글 제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하로 입력해 주세요.")
        String title,

        @NotBlank(message = "게시글 본문 내용을 입력해 주세요.")
        @Size(max = 20000, message = "본문은 20,000자 이하로 입력해 주세요.")
        String content,

        @Size(max = 50, message = "작성자 이름은 50자 이하로 입력해 주세요.")
        String guestName,

        @Size(max = 100, message = "비밀번호는 100자 이하로 입력해 주세요.")
        String guestPassword,

        Boolean pinned
) {
    public PostRequest {
        if (boardCode != null) boardCode = boardCode.trim();
        if (title != null) title = title.trim();
        if (content != null) content = content.trim();
        if (guestName != null) guestName = guestName.trim();
        if (guestPassword != null) guestPassword = guestPassword.trim();
    }
}
