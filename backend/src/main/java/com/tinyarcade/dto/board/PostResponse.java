package com.tinyarcade.dto.board;

import com.tinyarcade.entity.board.Board;
import com.tinyarcade.entity.board.GuidePost;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.user.UserRole;
import com.tinyarcade.entity.user.UserStatus;
import com.tinyarcade.entity.vote.VoteType;
import com.tinyarcade.service.vote.VoteService;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 게시글 및 가이드 목게시물 통합 응답 DTO.
 */
public record PostResponse(
        Long id,
        String displayId,
        boolean guide,
        Long boardId,
        String boardCode,
        String boardMenuName,
        Long userId,
        String nickname,
        UserRole userRole,
        UserStatus userStatus,
        boolean guest,
        boolean deleted,
        String title,
        String content,
        int commentCount,
        int recommendCount,
        int notRecommendCount,
        VoteType myVote,
        Boolean isAnswered,
        Boolean isPinned,
        String createdAt,
        String updatedAt
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm").withZone(ZoneId.of("Asia/Seoul"));

    public static PostResponse from(Post post, int commentCount, boolean hasAdminReply) {
        return from(post, commentCount, hasAdminReply, VoteService.VoteSummary.EMPTY);
    }

    public static PostResponse from(Post post, int commentCount, boolean hasAdminReply, VoteService.VoteSummary vote) {
        Board board = post.getBoard();
        String boardCode = board != null ? board.getCode() : (post.getBoardType() != null ? post.getBoardType().name() : "FREE");
        String boardMenuName = board != null ? board.getMenuName() : boardCode;

        User author = post.getUser();
        boolean isGuest = author == null && !post.isDeleted();
        String nickname;
        if (post.isDeleted()) {
            nickname = null;
        } else if (author != null) {
            nickname = author.getStatus() == UserStatus.WITHDRAWN ? "탈퇴한계정" : author.getNickname();
        } else {
            nickname = post.getGuestName();
        }

        Boolean isAnswered = "ASK".equalsIgnoreCase(boardCode) ? hasAdminReply : null;
        Boolean isPinned = !post.isDeleted() && post.isPinned();

        OffsetDateTime created = post.getCreatedAt() != null ? post.getCreatedAt() : OffsetDateTime.now();
        OffsetDateTime updated = post.getUpdatedAt();
        String createdStr = FORMATTER.format(created);
        String updatedStr = (!post.isDeleted() && updated != null && updated.isAfter(created.plusSeconds(2)))
                ? FORMATTER.format(updated)
                : null;

        VoteService.VoteSummary safeVote = (post.isDeleted() || vote == null) ? VoteService.VoteSummary.EMPTY : vote;

        return new PostResponse(
                post.getId(),
                String.valueOf(post.getId()),
                false,
                board != null ? board.getId() : null,
                boardCode,
                boardMenuName,
                author != null ? author.getId() : null,
                nickname,
                author != null ? author.getRole() : null,
                author != null ? author.getStatus() : null,
                isGuest,
                post.isDeleted(),
                post.isDeleted() ? "삭제된 게시물입니다." : post.getTitle(),
                post.isDeleted() ? "" : post.getContent(),
                commentCount,
                safeVote.recommendCount(),
                safeVote.notRecommendCount(),
                safeVote.myVote(),
                isAnswered,
                isPinned,
                createdStr,
                updatedStr
        );
    }

    public static PostResponse fromGuide(GuidePost guidePost, int commentCount) {
        Board board = guidePost.getBoard();
        OffsetDateTime created = guidePost.getCreatedAt() != null ? guidePost.getCreatedAt() : OffsetDateTime.now();
        OffsetDateTime updated = guidePost.getUpdatedAt();
        String createdStr = FORMATTER.format(created);
        String updatedStr = (updated != null && updated.isAfter(created.plusSeconds(2)))
                ? FORMATTER.format(updated)
                : null;

        return new PostResponse(
                null,
                guidePost.getDisplayId(),
                true,
                board.getId(),
                board.getCode(),
                board.getMenuName(),
                null,
                "사용가이드",
                UserRole.ADMIN,
                UserStatus.ACTIVE,
                false,
                false,
                guidePost.getTitle(),
                guidePost.getContent(),
                commentCount,
                0,
                0,
                null,
                null,
                true,
                createdStr,
                updatedStr
        );
    }
}
