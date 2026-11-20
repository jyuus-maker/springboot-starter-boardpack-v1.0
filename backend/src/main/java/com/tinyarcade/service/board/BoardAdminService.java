package com.tinyarcade.service.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.BoardRequest;
import com.tinyarcade.dto.board.BoardResetRequest;
import com.tinyarcade.dto.board.BoardResponse;
import com.tinyarcade.entity.board.Board;
import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.board.GuidePost;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.vote.VoteTargetType;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.board.BoardRepository;
import com.tinyarcade.repository.board.CommentRepository;
import com.tinyarcade.repository.board.GuideCommentRepository;
import com.tinyarcade.repository.board.GuidePostRepository;
import com.tinyarcade.repository.board.PostRepository;
import com.tinyarcade.repository.vote.AppVoteRepository;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 동적 게시판 설정·관리 서비스 (목록, 생성, 수정, 초기화, 삭제, 노출/관리자전용 제어).
 */
@Service
@RequiredArgsConstructor
public class BoardAdminService {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{2,30}$");
    private static final Set<String> RESERVED_CODES = Set.of(
            "free", "all", "write", "edit", "new", "admin", "api", "board", "login", "signup", "mypage"
    );

    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final GuidePostRepository guidePostRepository;
    private final GuideCommentRepository guideCommentRepository;
    private final AppVoteRepository appVoteRepository;

    /** 상단 메뉴 및 사용자 화면용 게시판 목록 (노출 ON + 관리자전용 규칙 적용) */
    @Transactional(readOnly = true)
    public List<BoardResponse> getPublicBoards(LoginUser loginUser) {
        boolean isAdmin = isAdmin(loginUser);
        return boardRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .filter(b -> isAdmin ? (b.isVisible() || b.isAdminOnly()) : (b.isVisible() && !b.isAdminOnly()))
                .map(BoardResponse::from)
                .toList();
    }

    /** 관리자용 전체 게시판 목록 */
    @Transactional(readOnly = true)
    public List<BoardResponse> getAllBoards() {
        return boardRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(BoardResponse::from)
                .toList();
    }

    /** 게시판 생성 */
    @Transactional
    public BoardResponse createBoard(BoardRequest request) {
        validateBoardCode(request.code(), null);
        if (boardRepository.existsByMenuNameIgnoreCase(request.menuName())) {
            throw new BusinessException(ErrorCode.BOARD_NAME_DUPLICATE);
        }
        int nextSort = boardRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .mapToInt(Board::getSortOrder)
                .max()
                .orElse(0) + 1;

        boolean visible = !request.adminOnly() && request.visible();
        Board board = Board.create(
                request.code(),
                request.menuName(),
                visible,
                request.adminOnly(),
                request.postWriteRole(),
                request.commentWriteRole(),
                false,
                nextSort
        );
        return BoardResponse.from(boardRepository.save(board));
    }

    /** 게시판 수정 (FREE는 삭제·노출OFF·관리자전용 전환 및 코드명 변경 불가) */
    @Transactional
    public BoardResponse updateBoard(Long boardId, BoardRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        if (board.isSystemDefault()) {
            if (!board.getCode().equalsIgnoreCase(request.code())) {
                throw new BusinessException(ErrorCode.RESERVED_BOARD_CODE, "기본 FREE 게시판의 코드명은 변경할 수 없습니다.");
            }
            if (!request.visible() || request.adminOnly()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "기본 FREE 게시판은 노출 OFF 또는 관리자 전용으로 변경할 수 없습니다.");
            }
        } else {
            validateBoardCode(request.code(), boardId);
        }

        if (boardRepository.existsByMenuNameIgnoreCaseAndIdNot(request.menuName(), boardId)) {
            throw new BusinessException(ErrorCode.BOARD_NAME_DUPLICATE);
        }

        board.update(
                board.isSystemDefault() ? board.getCode() : request.code(),
                request.menuName(),
                request.visible(),
                request.adminOnly(),
                request.postWriteRole(),
                request.commentWriteRole()
        );
        return BoardResponse.from(board);
    }

    /** 게시판 초기화 (ALL: 게시글+댓글+대댓글 전체 제거, COMMENTS_ONLY: 댓글+대댓글만 제거) */
    @Transactional
    public void resetBoard(Long boardId, BoardResetRequest.ResetMode mode) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        List<Post> posts = postRepository.findByBoardId(board.getId());
        if (posts.isEmpty()) {
            return;
        }
        List<Long> postIds = posts.stream().map(Post::getId).toList();
        List<Long> commentIds = commentRepository.findByTargetTypeAndTargetIdIn(CommentTargetType.POST, postIds)
                .stream().map(Comment::getId).toList();
        if (!commentIds.isEmpty()) {
            appVoteRepository.deleteByTargetIn(VoteTargetType.COMMENT, commentIds);
        }
        commentRepository.deleteRepliesByTargetIds(CommentTargetType.POST, postIds);
        commentRepository.deleteAllByTargetIds(CommentTargetType.POST, postIds);

        if (mode == BoardResetRequest.ResetMode.ALL) {
            appVoteRepository.deleteByTargetIn(VoteTargetType.POST, postIds);
            postRepository.deleteAllInBatch(posts);
        } else {
            List<Post> orphanDeletedPosts = posts.stream().filter(Post::isDeleted).toList();
            if (!orphanDeletedPosts.isEmpty()) {
                appVoteRepository.deleteByTargetIn(
                        VoteTargetType.POST, orphanDeletedPosts.stream().map(Post::getId).toList());
                postRepository.deleteAllInBatch(orphanDeletedPosts);
            }
        }
    }

    /** 게시판 삭제 (FREE 불가, 종속 게시글·댓글·가이드 함께 정리) */
    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
        if (board.isSystemDefault()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "기본 FREE 게시판은 삭제할 수 없습니다.");
        }

        resetBoard(boardId, BoardResetRequest.ResetMode.ALL);
        List<GuidePost> guides = guidePostRepository.findByBoardIdOrderByGuideNumberDesc(boardId);
        for (GuidePost g : guides) {
            guideCommentRepository.deleteRepliesByGuidePostId(g.getId());
            guideCommentRepository.deleteAllByGuidePostId(g.getId());
        }
        guidePostRepository.deleteByBoardId(boardId);
        boardRepository.delete(board);
    }

    /** 코드명으로 게시판 조회 및 접근 권한 검증 */
    @Transactional(readOnly = true)
    public Board requireAccessibleBoard(String code, LoginUser loginUser) {
        Board board = boardRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
        if (!canAccess(board, loginUser)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
        }
        return board;
    }

    public boolean canAccess(Board board, LoginUser loginUser) {
        if (isAdmin(loginUser)) {
            return true;
        }
        return board.isVisible() && !board.isAdminOnly();
    }

    public boolean isAdmin(LoginUser loginUser) {
        return loginUser != null && loginUser.role() == UserRole.ADMIN;
    }

    private void validateBoardCode(String code, Long excludeId) {
        if (code == null || !CODE_PATTERN.matcher(code).matches()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "코드명은 영문·숫자·하이픈(-)·언더스코어(_) 2~30자로 입력해 주세요.");
        }
        String lower = code.toLowerCase(Locale.ROOT);
        if (RESERVED_CODES.contains(lower)) {
            throw new BusinessException(ErrorCode.RESERVED_BOARD_CODE);
        }
        boolean duplicate = excludeId == null
                ? boardRepository.existsByCodeIgnoreCase(code)
                : boardRepository.existsByCodeIgnoreCaseAndIdNot(code, excludeId);
        if (duplicate) {
            throw new BusinessException(ErrorCode.BOARD_CODE_DUPLICATE);
        }
    }
}
