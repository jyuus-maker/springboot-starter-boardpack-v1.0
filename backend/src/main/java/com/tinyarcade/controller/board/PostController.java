package com.tinyarcade.controller.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.GuestPasswordRequest;
import com.tinyarcade.dto.board.PostRequest;
import com.tinyarcade.dto.board.PostResponse;
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
 * 게시글 및 가이드 목게시물 API.
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final BoardService boardService;

    /** 게시글 목록 조회 (전체 또는 boardCode 필터) */
    @GetMapping
    public List<PostResponse> list(@RequestParam(required = false) String boardCode,
                                   @AuthenticationPrincipal LoginUser loginUser) {
        return boardService.getPosts(boardCode, loginUser);
    }

    /** 게시글 단건 조회 (실게시글 ID 또는 ex1, ex2... 가이드 ID) */
    @GetMapping("/{postId}")
    public PostResponse detail(@PathVariable String postId,
                               @AuthenticationPrincipal LoginUser loginUser) {
        return boardService.getPost(postId, loginUser);
    }

    /** 게시글 작성 (게시판 권한에 따라 비로그인/사용자/관리자 허용) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody PostRequest request) {
        return boardService.createPost(loginUser, request);
    }

    /** 게시글 수정 (작성자 본인, 비로그인 비밀번호 확인, 또는 가이드 관리자 수정) */
    @PutMapping("/{postId}")
    public PostResponse update(@PathVariable String postId,
                               @AuthenticationPrincipal LoginUser loginUser,
                               @Valid @RequestBody PostRequest request) {
        return boardService.updatePost(postId, loginUser, request);
    }

    /** 게시글 삭제 (작성자 본인, 비로그인 비밀번호 확인, 또는 관리자) */
    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String postId,
                       @AuthenticationPrincipal LoginUser loginUser,
                       @RequestParam(required = false) String guestPassword,
                       @RequestBody(required = false) GuestPasswordRequest body) {
        String pw = guestPassword != null ? guestPassword : (body != null ? body.guestPassword() : null);
        boardService.deletePost(postId, loginUser, pw);
    }
}
