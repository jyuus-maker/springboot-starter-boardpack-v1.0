package com.tinyarcade.controller.admin;

import com.tinyarcade.dto.board.BoardRequest;
import com.tinyarcade.dto.board.BoardResetRequest;
import com.tinyarcade.dto.board.BoardResponse;
import com.tinyarcade.service.board.BoardAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 게시판 운영 API (생성·수정·초기화·삭제·노출·관리자전용).
 */
@RestController
@RequestMapping("/api/admin/boards")
@RequiredArgsConstructor
public class AdminBoardController {

    private final BoardAdminService boardAdminService;

    @GetMapping
    public List<BoardResponse> list() {
        return boardAdminService.getAllBoards();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponse create(@Valid @RequestBody BoardRequest request) {
        return boardAdminService.createBoard(request);
    }

    @PutMapping("/{boardId}")
    public BoardResponse update(@PathVariable Long boardId, @Valid @RequestBody BoardRequest request) {
        return boardAdminService.updateBoard(boardId, request);
    }

    @PostMapping("/{boardId}/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@PathVariable Long boardId, @Valid @RequestBody BoardResetRequest request) {
        boardAdminService.resetBoard(boardId, request.mode());
    }

    @DeleteMapping("/{boardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long boardId) {
        boardAdminService.deleteBoard(boardId);
    }
}
