package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.board.GuideComment;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.entity.vote.VoteType;
import com.tinyarcade.service.vote.VoteService;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 댓글·대댓글 응답 DTO (일반 댓글 + 삭제된 댓글 + 가이드 목댓글 + 추천·비추천 지원).
 */
public record CommentResponse(
        Long id,
        CommentTargetType targetType,
        Long targetId,
        Long userId,
        String nickname,
        UserStatus userStatus,
        Boolean isAdmin,
        boolean deleted,
        boolean guide,
        String content,
        int recommendCount,
        int notRecommendCount,
        VoteType myVote,
        String createdAt,
        List<ReplyResponse> replies
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm").withZone(ZoneId.of("Asia/Seoul"));

    public record ReplyResponse(
            Long id,
            Long parentId,
            Long userId,
            String nickname,
            UserStatus userStatus,
            Boolean isAdmin,
            boolean deleted,
            boolean guide,
            String content,
            int recommendCount,
            int notRecommendCount,
            VoteType myVote,
            String createdAt
    ) {
        public static ReplyResponse from(Comment reply) {
            return from(reply, VoteService.VoteSummary.EMPTY);
        }

        public static ReplyResponse from(Comment reply, VoteService.VoteSummary vote) {
            User author = reply.getUser();
            String nickname = reply.isDeleted()
                    ? null
                    : (author == null ? null : (author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한계정" : author.getNickname()));
            OffsetDateTime created = reply.getCreatedAt() != null ? reply.getCreatedAt() : OffsetDateTime.now();
            VoteService.VoteSummary safeVote = (reply.isDeleted() || vote == null) ? VoteService.VoteSummary.EMPTY : vote;
            return new ReplyResponse(
                    reply.getId(),
                    reply.getParent() != null ? reply.getParent().getId() : null,
                    author != null ? author.getId() : null,
                    nickname,
                    author != null ? author.getStatus() : null,
                    author != null && author.getRole() == UserRole.ADMIN,
                    reply.isDeleted(),
                    false,
                    reply.isDeleted() ? "삭제된 댓글입니다." : reply.getContent(),
                    safeVote.recommendCount(),
                    safeVote.notRecommendCount(),
                    safeVote.myVote(),
                    FORMATTER.format(created)
            );
        }

        public static ReplyResponse fromGuide(GuideComment reply) {
            OffsetDateTime created = reply.getCreatedAt() != null ? reply.getCreatedAt() : OffsetDateTime.now();
            return new ReplyResponse(
                    reply.getId(),
                    reply.getParent() != null ? reply.getParent().getId() : null,
                    null,
                    "사용가이드",
                    UserStatus.ACTIVE,
                    false,
                    false,
                    true,
                    reply.getContent(),
                    0,
                    0,
                    null,
                    FORMATTER.format(created)
            );
        }
    }

    public static CommentResponse from(Comment root, List<ReplyResponse> replies) {
        return from(root, replies, VoteService.VoteSummary.EMPTY);
    }

    public static CommentResponse from(Comment root, List<ReplyResponse> replies, VoteService.VoteSummary vote) {
        User author = root.getUser();
        String nickname = root.isDeleted()
                ? null
                : (author == null ? null : (author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한계정" : author.getNickname()));
        OffsetDateTime created = root.getCreatedAt() != null ? root.getCreatedAt() : OffsetDateTime.now();
        VoteService.VoteSummary safeVote = (root.isDeleted() || vote == null) ? VoteService.VoteSummary.EMPTY : vote;
        return new CommentResponse(
                root.getId(),
                root.getTargetType(),
                root.getTargetId(),
                author != null ? author.getId() : null,
                nickname,
                author != null ? author.getStatus() : null,
                author != null && author.getRole() == UserRole.ADMIN,
                root.isDeleted(),
                false,
                root.isDeleted() ? "삭제된 댓글입니다." : root.getContent(),
                safeVote.recommendCount(),
                safeVote.notRecommendCount(),
                safeVote.myVote(),
                FORMATTER.format(created),
                replies
        );
    }

    public static CommentResponse fromGuide(GuideComment root, List<ReplyResponse> replies) {
        OffsetDateTime created = root.getCreatedAt() != null ? root.getCreatedAt() : OffsetDateTime.now();
        return new CommentResponse(
                root.getId(),
                CommentTargetType.POST,
                null,
                null,
                "사용가이드",
                UserStatus.ACTIVE,
                false,
                false,
                true,
                root.getContent(),
                0,
                0,
                null,
                FORMATTER.format(created),
                replies
        );
    }
}
