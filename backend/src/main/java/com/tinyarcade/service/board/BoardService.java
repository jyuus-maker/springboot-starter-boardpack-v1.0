package com.tinyarcade.service.board;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.board.CommentRequest;
import com.tinyarcade.dto.board.CommentResponse;
import com.tinyarcade.dto.board.CommentUpdateRequest;
import com.tinyarcade.dto.board.PostRequest;
import com.tinyarcade.dto.board.PostResponse;
import com.tinyarcade.entity.board.Board;
import com.tinyarcade.entity.board.BoardWriteRole;
import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.board.GuideComment;
import com.tinyarcade.entity.board.GuidePost;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.vote.VoteTargetType;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.board.BoardRepository;
import com.tinyarcade.repository.board.CommentRepository;
import com.tinyarcade.repository.board.GuideCommentRepository;
import com.tinyarcade.repository.board.GuidePostRepository;
import com.tinyarcade.repository.board.PostRepository;
import com.tinyarcade.repository.user.UserRepository;
import com.tinyarcade.service.vote.VoteService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시글·댓글·가이드 목게시물 및 삭제 연쇄 처리 서비스.
 */
@Service
@RequiredArgsConstructor
public class BoardService {

    private static final Pattern GUIDE_ID_PATTERN = Pattern.compile("^ex(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final BoardRepository boardRepository;
    private final BoardAdminService boardAdminService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final GuidePostRepository guidePostRepository;
    private final GuideCommentRepository guideCommentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VoteService voteService;

    /** 게시글 목록 조회 (전체 또는 특정 게시판, 가이드 목게시물 ex3->ex2->ex1 + 실게시글 최신순) */
    @Transactional(readOnly = true)
    public List<PostResponse> getPosts(String boardCode, LoginUser loginUser) {
        List<Board> targetBoards;
        if (boardCode == null || boardCode.isBlank()) {
            targetBoards = boardRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                    .filter(b -> b.isVisible() && !b.isAdminOnly())
                    .toList();
        } else {
            Board board = boardAdminService.requireAccessibleBoard(boardCode, loginUser);
            targetBoards = List.of(board);
        }

        if (targetBoards.isEmpty()) {
            return List.of();
        }
        List<Long> boardIds = targetBoards.stream().map(Board::getId).toList();

        List<GuidePost> guides = guidePostRepository.findByBoardIdInOrderByGuideNumberDesc(boardIds);
        List<Post> posts = postRepository.findByBoardIdInOrderByIdDesc(boardIds);

        List<PostResponse> result = new ArrayList<>();

        if (!guides.isEmpty()) {
            List<Long> guideIds = guides.stream().map(GuidePost::getId).toList();
            Map<Long, Integer> guideCommentCountMap = new HashMap<>();
            for (GuideComment gc : guideCommentRepository.findByGuidePostIdIn(guideIds)) {
                guideCommentCountMap.merge(gc.getGuidePost().getId(), 1, Integer::sum);
            }
            for (GuidePost guide : guides) {
                result.add(PostResponse.fromGuide(guide, guideCommentCountMap.getOrDefault(guide.getId(), 0)));
            }
        }

        if (!posts.isEmpty()) {
            List<Long> postIds = posts.stream().map(Post::getId).toList();
            List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdIn(CommentTargetType.POST, postIds);

            Map<Long, Integer> countMap = new HashMap<>();
            Map<Long, Boolean> adminReplyMap = new HashMap<>();
            for (Comment c : comments) {
                Long postId = c.getTargetId();
                if (postId == null) continue;
                countMap.merge(postId, 1, Integer::sum);
                if (!c.isDeleted() && c.getUser() != null && c.getUser().getRole() == UserRole.ADMIN) {
                    adminReplyMap.put(postId, true);
                }
            }

            List<Post> pinnedPosts = new ArrayList<>();
            List<Post> normalPosts = new ArrayList<>();
            for (Post post : posts) {
                if (!post.isDeleted() && post.isPinned()) {
                    pinnedPosts.add(post);
                } else {
                    normalPosts.add(post);
                }
            }

            Map<Long, VoteService.VoteSummary> voteMap = voteService.getVoteStats(
                    VoteTargetType.POST, postIds, loginUser != null ? loginUser.id() : null);

            for (Post post : pinnedPosts) {
                result.add(PostResponse.from(
                        post,
                        countMap.getOrDefault(post.getId(), 0),
                        adminReplyMap.getOrDefault(post.getId(), false),
                        voteMap.getOrDefault(post.getId(), VoteService.VoteSummary.EMPTY)
                ));
            }
            for (Post post : normalPosts) {
                result.add(PostResponse.from(
                        post,
                        countMap.getOrDefault(post.getId(), 0),
                        adminReplyMap.getOrDefault(post.getId(), false),
                        voteMap.getOrDefault(post.getId(), VoteService.VoteSummary.EMPTY)
                ));
            }
        }

        return result;
    }

    /** 게시글 단건 상세 조회 (실게시글 ID 또는 ex1, ex2... 가이드 ID 모두 지원) */
    @Transactional(readOnly = true)
    public PostResponse getPost(String postIdOrGuideId, LoginUser loginUser) {
        Integer guideNum = parseGuideNumber(postIdOrGuideId);
        if (guideNum != null) {
            GuidePost guide = guidePostRepository.findWithBoardByGuideNumber(guideNum)
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            if (!boardAdminService.canAccess(guide.getBoard(), loginUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
            }
            int count = guideCommentRepository.findByGuidePostIdOrderByIdAsc(guide.getId()).size();
            return PostResponse.fromGuide(guide, count);
        }

        Long postId = parseNumericId(postIdOrGuideId);
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (post.getBoard() != null && !boardAdminService.canAccess(post.getBoard(), loginUser)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
        }
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(
                CommentTargetType.POST, postId);
        int count = comments.size();
        boolean hasAdminReply = comments.stream()
                .anyMatch(c -> !c.isDeleted() && c.getUser() != null && c.getUser().getRole() == UserRole.ADMIN);
        VoteService.VoteSummary vote = voteService.getVoteStats(
                VoteTargetType.POST, List.of(postId), loginUser != null ? loginUser.id() : null)
                .getOrDefault(postId, VoteService.VoteSummary.EMPTY);
        return PostResponse.from(post, count, hasAdminReply, vote);
    }

    /** 게시글 작성 (게시판별 작성권한 검사, 비로그인 허용 시 작성자·비밀번호 필수) */
    @Transactional
    public PostResponse createPost(LoginUser loginUser, PostRequest request) {
        Board board = boardAdminService.requireAccessibleBoard(request.boardCode(), loginUser);
        enforceWriteRole(board.getPostWriteRole(), loginUser);

        if (loginUser == null) {
            if (request.guestName() == null || request.guestName().isBlank()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "작성자 이름을 입력해 주세요.");
            }
            if (request.guestPassword() == null || request.guestPassword().isBlank()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "비밀번호를 입력해 주세요.");
            }
            Post saved = postRepository.save(Post.createForGuest(
                    board,
                    request.guestName(),
                    passwordEncoder.encode(request.guestPassword()),
                    request.title(),
                    request.content()
            ));
            return PostResponse.from(saved, 0, false);
        }

        User author = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        Post newPost = Post.createForUser(board, author, request.title(), request.content());
        if (boardAdminService.isAdmin(loginUser)) {
            newPost.updatePinned(Boolean.TRUE.equals(request.pinned()));
        }
        Post saved = postRepository.save(newPost);
        return PostResponse.from(saved, 0, false);
    }

    /** 게시글 수정 (실게시글: 회원 작성자 본인 or 비로그인 비밀번호 확인 / 가이드: 관리자만) */
    @Transactional
    public PostResponse updatePost(String postIdOrGuideId, LoginUser loginUser, PostRequest request) {
        Integer guideNum = parseGuideNumber(postIdOrGuideId);
        if (guideNum != null) {
            if (!boardAdminService.isAdmin(loginUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "가이드 게시물은 관리자만 수정할 수 있습니다.");
            }
            GuidePost guide = guidePostRepository.findWithBoardByGuideNumber(guideNum)
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            Board targetBoard = boardAdminService.requireAccessibleBoard(request.boardCode(), loginUser);
            guide.update(targetBoard, request.title(), request.content());
            int count = guideCommentRepository.findByGuidePostIdOrderByIdAsc(guide.getId()).size();
            return PostResponse.fromGuide(guide, count);
        }

        Long postId = parseNumericId(postIdOrGuideId);
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (post.isDeleted()) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND, "삭제된 게시글은 수정할 수 없습니다.");
        }

        if (post.getUser() != null) {
            requireLogin(loginUser);
            if (!Objects.equals(post.getUser().getId(), loginUser.id())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "본인이 작성한 글만 수정할 수 있습니다.");
            }
        } else {
            verifyGuestPassword(request.guestPassword(), post.getGuestPasswordHash());
        }

        Board targetBoard = boardAdminService.requireAccessibleBoard(request.boardCode(), loginUser);
        enforceWriteRole(targetBoard.getPostWriteRole(), loginUser);

        post.update(targetBoard, request.title(), request.content());
        if (boardAdminService.isAdmin(loginUser) && request.pinned() != null) {
            post.updatePinned(request.pinned());
        }
        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(
                CommentTargetType.POST, postId);
        boolean hasAdminReply = comments.stream()
                .anyMatch(c -> !c.isDeleted() && c.getUser() != null && c.getUser().getRole() == UserRole.ADMIN);
        return PostResponse.from(post, comments.size(), hasAdminReply);
    }

    /** 게시글 삭제 (가이드: 관리자만 / 실게시글: 작성자·비밀번호·관리자 확인 후 댓글 유무에 따라 내용 삭제 또는 완전 제거) */
    @Transactional
    public void deletePost(String postIdOrGuideId, LoginUser loginUser, String guestPassword) {
        Integer guideNum = parseGuideNumber(postIdOrGuideId);
        if (guideNum != null) {
            if (!boardAdminService.isAdmin(loginUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "가이드 게시물은 관리자만 삭제할 수 있습니다.");
            }
            GuidePost guide = guidePostRepository.findWithBoardByGuideNumber(guideNum)
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            guideCommentRepository.deleteRepliesByGuidePostId(guide.getId());
            guideCommentRepository.deleteAllByGuidePostId(guide.getId());
            guidePostRepository.delete(guide);
            return;
        }

        Long postId = parseNumericId(postIdOrGuideId);
        Post post = postRepository.findWithUserById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (post.isDeleted()) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        boolean isAdmin = boardAdminService.isAdmin(loginUser);
        if (!isAdmin) {
            if (post.getUser() != null) {
                requireLogin(loginUser);
                if (!Objects.equals(post.getUser().getId(), loginUser.id())) {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "작성자 본인만 삭제할 수 있습니다.");
                }
            } else {
                verifyGuestPassword(guestPassword, post.getGuestPasswordHash());
            }
        }

        long commentCount = commentRepository.countByTargetTypeAndTargetId(CommentTargetType.POST, postId);
        if (commentCount > 0) {
            post.markDeleted();
        } else {
            postRepository.delete(post);
        }
        voteService.deleteVotesForTarget(VoteTargetType.POST, postId);
    }

    /** 댓글·대댓글 트리 목록 조회 (실게시글 또는 가이드 ex{n}) */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(CommentTargetType targetType, String targetIdOrGuideId, LoginUser loginUser) {
        if (targetType == CommentTargetType.POST && targetIdOrGuideId != null) {
            Integer guideNum = parseGuideNumber(targetIdOrGuideId);
            if (guideNum != null) {
                GuidePost guide = guidePostRepository.findWithBoardByGuideNumber(guideNum)
                        .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
                if (!boardAdminService.canAccess(guide.getBoard(), loginUser)) {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
                }
                return buildGuideCommentTree(guideCommentRepository.findByGuidePostIdOrderByIdAsc(guide.getId()));
            }
        }

        Long numericTargetId = targetIdOrGuideId == null || targetIdOrGuideId.isBlank()
                ? null : parseNumericId(targetIdOrGuideId);
        List<Comment> all = numericTargetId == null
                ? commentRepository.findByTargetTypeAndTargetIdIsNullOrderByIdAsc(targetType)
                : commentRepository.findByTargetTypeAndTargetIdOrderByIdAsc(targetType, numericTargetId);

        List<Long> commentIds = all.stream().map(Comment::getId).toList();
        Map<Long, VoteService.VoteSummary> voteMap = voteService.getVoteStats(
                VoteTargetType.COMMENT, commentIds, loginUser != null ? loginUser.id() : null);

        Map<Long, List<CommentResponse.ReplyResponse>> replyMap = new HashMap<>();
        List<Comment> roots = new ArrayList<>();

        for (Comment c : all) {
            VoteService.VoteSummary vote = voteMap.getOrDefault(c.getId(), VoteService.VoteSummary.EMPTY);
            if (c.getParent() == null) {
                roots.add(c);
            } else {
                replyMap.computeIfAbsent(c.getParent().getId(), k -> new ArrayList<>())
                        .add(CommentResponse.ReplyResponse.from(c, vote));
            }
        }

        return roots.stream()
                .sorted(Comparator.comparing(Comment::getId))
                .map(root -> CommentResponse.from(
                        root,
                        replyMap.getOrDefault(root.getId(), List.of()),
                        voteMap.getOrDefault(root.getId(), VoteService.VoteSummary.EMPTY)))
                .toList();
    }

    /** 댓글·대댓글 작성 (게시판별 댓글 작성권한 검사, 대댓글은 1단계만) */
    @Transactional
    public List<CommentResponse> createComment(LoginUser loginUser, CommentRequest request) {
        requireLogin(loginUser);
        if (request.targetType() == CommentTargetType.POST) {
            if (request.targetId() == null) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "게시글 ID가 필요합니다.");
            }
            Post post = postRepository.findWithUserById(request.targetId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            if (post.isDeleted()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "삭제된 게시글에는 댓글을 작성할 수 없습니다.");
            }
            if (post.getBoard() != null) {
                if (!boardAdminService.canAccess(post.getBoard(), loginUser)) {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
                }
                enforceWriteRole(post.getBoard().getCommentWriteRole(), loginUser);
            }
        }

        User author = userRepository.findById(loginUser.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findWithUserById(request.parentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
            if (parent.getParent() != null) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "대댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.isDeleted()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "삭제된 댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.getTargetType() != request.targetType()
                    || !Objects.equals(parent.getTargetId(), request.targetId())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "상위 댓글과 대상이 일치하지 않습니다.");
            }
        }

        commentRepository.save(Comment.create(
                request.targetType(), request.targetId(), parent, author, request.content()));

        String targetKey = request.targetId() != null ? String.valueOf(request.targetId()) : null;
        return getComments(request.targetType(), targetKey, loginUser);
    }

    /** 댓글·대댓글 수정 (작성자 본인만 가능, 삭제된 댓글 불가) */
    @Transactional
    public CommentResponse.ReplyResponse updateComment(Long commentId, LoginUser loginUser, CommentUpdateRequest request) {
        requireLogin(loginUser);
        Comment comment = commentRepository.findWithUserById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.isDeleted()) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND, "삭제된 댓글은 수정할 수 없습니다.");
        }
        if (comment.getUser() == null || !Objects.equals(comment.getUser().getId(), loginUser.id())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "본인이 작성한 댓글만 수정할 수 있습니다.");
        }
        comment.update(request.content());
        return CommentResponse.ReplyResponse.from(comment);
    }

    /** 댓글·대댓글 삭제 (작성자·관리자 확인, 대댓글 잔존 시 내용만 지우고 마지막 대댓글 삭제 시 연쇄 정리) */
    @Transactional
    public void deleteComment(Long commentId, LoginUser loginUser) {
        requireLogin(loginUser);
        Comment comment = commentRepository.findWithUserById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.isDeleted()) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }

        boolean isOwner = comment.getUser() != null && Objects.equals(comment.getUser().getId(), loginUser.id());
        boolean isAdmin = boardAdminService.isAdmin(loginUser);
        if (!isOwner && !isAdmin) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자 본인 또는 관리자만 삭제할 수 있습니다.");
        }

        CommentTargetType targetType = comment.getTargetType();
        Long targetId = comment.getTargetId();
        Comment parent = comment.getParent();

        voteService.deleteVotesForTarget(VoteTargetType.COMMENT, commentId);

        if (parent == null) {
            long replyCount = commentRepository.countByParentId(commentId);
            if (replyCount > 0) {
                comment.markDeleted();
            } else {
                commentRepository.delete(comment);
                commentRepository.flush();
                cleanupOrphanDeletedPost(targetType, targetId);
            }
        } else {
            commentRepository.delete(comment);
            commentRepository.flush();
            if (parent.isDeleted() && commentRepository.countByParentId(parent.getId()) == 0) {
                commentRepository.delete(parent);
                commentRepository.flush();
            }
            cleanupOrphanDeletedPost(targetType, targetId);
        }
    }

    private void cleanupOrphanDeletedPost(CommentTargetType targetType, Long targetId) {
        if (targetType == CommentTargetType.POST && targetId != null) {
            postRepository.findById(targetId).ifPresent(post -> {
                if (post.isDeleted()
                        && commentRepository.countByTargetTypeAndTargetId(CommentTargetType.POST, targetId) == 0) {
                    postRepository.delete(post);
                }
            });
        }
    }

    private List<CommentResponse> buildGuideCommentTree(List<GuideComment> all) {
        Map<Long, List<CommentResponse.ReplyResponse>> replyMap = new HashMap<>();
        List<GuideComment> roots = new ArrayList<>();
        for (GuideComment gc : all) {
            if (gc.getParent() == null) {
                roots.add(gc);
            } else {
                replyMap.computeIfAbsent(gc.getParent().getId(), k -> new ArrayList<>())
                        .add(CommentResponse.ReplyResponse.fromGuide(gc));
            }
        }
        return roots.stream()
                .sorted(Comparator.comparing(GuideComment::getId))
                .map(root -> CommentResponse.fromGuide(root, replyMap.getOrDefault(root.getId(), List.of())))
                .toList();
    }

    private void enforceWriteRole(BoardWriteRole requiredRole, LoginUser loginUser) {
        if (requiredRole == BoardWriteRole.ANONYMOUS) {
            return;
        }
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        if (!requiredRole.allows(loginUser)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void verifyGuestPassword(String rawPassword, String passwordHash) {
        if (rawPassword == null || rawPassword.isBlank()
                || passwordHash == null || !passwordEncoder.matches(rawPassword, passwordHash)) {
            throw new BusinessException(ErrorCode.INVALID_GUEST_PASSWORD);
        }
    }

    private Integer parseGuideNumber(String idStr) {
        if (idStr == null) return null;
        Matcher m = GUIDE_ID_PATTERN.matcher(idStr.trim());
        return m.matches() ? Integer.parseInt(m.group(1)) : null;
    }

    private Long parseNumericId(String idStr) {
        try {
            return Long.parseLong(idStr.trim());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
    }

    private void requireLogin(LoginUser loginUser) {
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
