package com.tinyarcade.controller.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.CommentRequest;
import com.tinyarcade.dto.board.CommentResponse;
import com.tinyarcade.dto.board.CommentUpdateRequest;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.service.board.BoardService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 댓글·대댓글 API.
 */
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final BoardService boardService;

    /** 댓글 목록 조회 (실게시글 ID 또는 가이드 ex1 등) */
    @GetMapping
    public List<CommentResponse> list(@RequestParam CommentTargetType targetType,
                                      @RequestParam(required = false) String targetId,
                                      @AuthenticationPrincipal LoginUser loginUser) {
        return boardService.getComments(targetType, targetId, loginUser);
    }

    /** 댓글·대댓글 작성 (게시판 댓글 권한 검사) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<CommentResponse> create(@AuthenticationPrincipal LoginUser loginUser,
                                        @Valid @RequestBody CommentRequest request) {
        return boardService.createComment(loginUser, request);
    }

    /** 댓글·대댓글 수정 (작성자 본인만) */
    @PutMapping("/{commentId}")
    public CommentResponse.ReplyResponse update(@PathVariable Long commentId,
                                                @AuthenticationPrincipal LoginUser loginUser,
                                                @Valid @RequestBody CommentUpdateRequest request) {
        return boardService.updateComment(commentId, loginUser, request);
    }

    /** 댓글·대댓글 삭제 (작성자 본인 또는 관리자) */
    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long commentId,
                       @AuthenticationPrincipal LoginUser loginUser) {
        boardService.deleteComment(commentId, loginUser);
    }
}
