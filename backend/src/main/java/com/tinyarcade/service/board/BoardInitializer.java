package com.tinyarcade.service.board;

import com.tinyarcade.entity.board.AppInitFlag;
import com.tinyarcade.entity.board.Board;
import com.tinyarcade.entity.board.BoardType;
import com.tinyarcade.entity.board.BoardWriteRole;
import com.tinyarcade.entity.board.GuideComment;
import com.tinyarcade.entity.board.GuidePost;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.repository.board.AppInitFlagRepository;
import com.tinyarcade.repository.board.BoardRepository;
import com.tinyarcade.repository.board.GuideCommentRepository;
import com.tinyarcade.repository.board.GuidePostRepository;
import com.tinyarcade.repository.board.PostRepository;
import com.tinyarcade.service.auth.MockAccountService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 애플리케이션 시작 시 기본 게시판(FREE/ASK/FAQ), 기존 데이터 이전, 초기 가이드 초안, 초기 목계정을 준비한다.
 */
@Component
@RequiredArgsConstructor
public class BoardInitializer {

    private static final String GUIDE_SEED_KEY = "guide_posts_seeded_v1";

    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final GuidePostRepository guidePostRepository;
    private final GuideCommentRepository guideCommentRepository;
    private final AppInitFlagRepository initFlagRepository;
    private final MockAccountService mockAccountService;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initialize() {
        Board free = ensureBoard("FREE", "자유게시판", true, false,
                BoardWriteRole.ANONYMOUS, BoardWriteRole.USER, true, 1);
        Board ask = ensureBoard("ASK", "문의게시판", true, false,
                BoardWriteRole.USER, BoardWriteRole.ADMIN, false, 2);
        Board faq = ensureBoard("FAQ", "FAQ", true, false,
                BoardWriteRole.ADMIN, BoardWriteRole.ADMIN, false, 3);

        migrateLegacyPosts(free, ask, faq);
        seedDraftGuidePosts(free, faq);
        mockAccountService.syncMockAccounts();
    }

    private Board ensureBoard(String code, String menuName, boolean visible, boolean adminOnly,
                              BoardWriteRole postWriteRole, BoardWriteRole commentWriteRole,
                              boolean systemDefault, int sortOrder) {
        return boardRepository.findByCodeIgnoreCase(code)
                .orElseGet(() -> boardRepository.save(Board.create(
                        code, menuName, visible, adminOnly,
                        postWriteRole, commentWriteRole, systemDefault, sortOrder
                )));
    }

    private void migrateLegacyPosts(Board free, Board ask, Board faq) {
        List<Post> legacyPosts = postRepository.findByBoardIsNull();
        for (Post post : legacyPosts) {
            BoardType type = post.getBoardType();
            if (type == BoardType.INQUIRY) {
                post.assignBoard(ask);
            } else if (type == BoardType.FAQ) {
                post.assignBoard(faq);
            } else {
                post.assignBoard(free);
            }
        }
    }

    private void seedDraftGuidePosts(Board free, Board faq) {
        if (initFlagRepository.existsById(GUIDE_SEED_KEY)) {
            return;
        }
        if (guidePostRepository.count() == 0) {
            GuidePost ex1 = guidePostRepository.save(GuidePost.create(
                    1,
                    free,
                    "[초안] 게시글과 댓글·대댓글 작성 안내",
                    "FREE 게시판에서는 비로그인 상태에서도 작성자 이름과 비밀번호를 입력해 글을 작성할 수 있습니다.\n"
                            + "작성 시 입력한 비밀번호로 글을 수정하거나 삭제할 수 있습니다.\n"
                            + "댓글과 1단계 대댓글은 로그인 후 작성할 수 있습니다."
            ));
            GuideComment root = guideCommentRepository.save(GuideComment.create(
                    ex1, null, "게시글 아래에 이와 같이 댓글을 작성할 수 있습니다."
            ));
            guideCommentRepository.save(GuideComment.create(
                    ex1, root, "댓글에 대한 대댓글은 1단계까지 지원합니다."
            ));

            guidePostRepository.save(GuidePost.create(
                    2,
                    free,
                    "[초안] 게시글·댓글 삭제 및 연결 관계 안내",
                    "댓글이나 대댓글이 남아 있는 게시글을 삭제하면 원문은 지워지고 '삭제된 게시물입니다.'로 표시됩니다.\n"
                            + "대댓글이 남아 있는 댓글을 삭제하면 '삭제된 댓글입니다.'로 표시되며,\n"
                            + "마지막 대댓글이 삭제되면 남아 있던 삭제 댓글과 게시글 자리도 함께 정리됩니다."
            ));

            guidePostRepository.save(GuidePost.create(
                    3,
                    faq,
                    "[초안] 게시판별 작성 권한과 초기 목계정 안내",
                    "기본 게시판은 FREE(비로그인 글 작성 / 사용자 댓글), ASK(사용자 글 작성 / 관리자 답변), FAQ(관리자 전용)로 구성됩니다.\n"
                            + "초기 테스트용 계정(admin / user, 비밀번호 1234)은 실제 관리자 또는 일반 회원이 가입하면 자동으로 정리됩니다."
            ));
        }
        initFlagRepository.save(AppInitFlag.done(GUIDE_SEED_KEY));
    }
}
