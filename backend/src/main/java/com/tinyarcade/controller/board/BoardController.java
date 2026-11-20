package com.tinyarcade.controller.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.BoardResponse;
import com.tinyarcade.service.board.BoardAdminService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공개 게시판 목록 API (상단 메뉴 및 글쓰기 게시판 선택용).
 */
@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardAdminService boardAdminService;

    @GetMapping
    public List<BoardResponse> list(@AuthenticationPrincipal LoginUser loginUser) {
        return boardAdminService.getPublicBoards(loginUser);
    }
}
