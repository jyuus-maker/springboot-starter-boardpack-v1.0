package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.Board;
import com.tinyarcade.entity.board.BoardWriteRole;

/**
 * 게시판 설정 응답 DTO.
 */
public record BoardResponse(
        Long id,
        String code,
        String menuName,
        boolean visible,
        boolean adminOnly,
        BoardWriteRole postWriteRole,
        BoardWriteRole commentWriteRole,
        boolean systemDefault,
        int sortOrder
) {
    public static BoardResponse from(Board board) {
        return new BoardResponse(
                board.getId(),
                board.getCode(),
                board.getMenuName(),
                board.isVisible(),
                board.isAdminOnly(),
                board.getPostWriteRole(),
                board.getCommentWriteRole(),
                board.isSystemDefault(),
                board.getSortOrder()
        );
    }
}
