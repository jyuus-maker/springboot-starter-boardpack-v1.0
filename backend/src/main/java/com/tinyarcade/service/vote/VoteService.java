package com.tinyarcade.service.vote;

import com.tinyarcade.config.security.LoginUser;
import com.tinyarcade.dto.vote.VoteResponse;
import com.tinyarcade.entity.board.Comment;
import com.tinyarcade.entity.board.CommentTargetType;
import com.tinyarcade.entity.board.Post;
import com.tinyarcade.entity.user.User;
import com.tinyarcade.entity.vote.AppVote;
import com.tinyarcade.entity.vote.AppVoteId;
import com.tinyarcade.entity.vote.VoteTargetType;
import com.tinyarcade.entity.vote.VoteType;
import com.tinyarcade.exception.BusinessException;
import com.tinyarcade.exception.ErrorCode;
import com.tinyarcade.repository.board.CommentRepository;
import com.tinyarcade.repository.board.PostRepository;
import com.tinyarcade.repository.user.UserRepository;
import com.tinyarcade.repository.vote.AppVoteRepository;
import com.tinyarcade.service.board.BoardAdminService;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 추천·비추천 핵심 토글, 중복 방지 및 집계 서비스.
 */
@Service
@RequiredArgsConstructor
public class VoteService {

    private final AppVoteRepository voteRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final BoardAdminService boardAdminService;

    public record VoteSummary(int recommendCount, int notRecommendCount, VoteType myVote) {
        public static final VoteSummary EMPTY = new VoteSummary(0, 0, null);
    }

    public record VoteToggleResult(
            VoteType myVote,
            int recommendDelta,
            int notRecommendDelta
    ) {}

    /** 게시글·댓글·대댓글 투표 처리 (로그인 필수, 삭제된 대상 및 비공개 게시판 차단) */
    @Transactional
    public VoteResponse vote(LoginUser loginUser, VoteTargetType targetType, Long targetId, VoteType voteType) {
        if (loginUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        validateTargetAccessible(loginUser, targetType, targetId);
        VoteToggleResult result = toggleVote(targetType, targetId, loginUser.id(), voteType);
        VoteSummary summary = getVoteStats(targetType, List.of(targetId), loginUser.id())
                .getOrDefault(targetId, VoteSummary.EMPTY);
        return new VoteResponse(result.myVote(), summary.recommendCount(), summary.notRecommendCount());
    }

    /**
     * 비관적 잠금(SELECT ... FOR UPDATE) 기반 추천·비추천 토글 처리 및 증감(delta) 계산.
     * 동시 중복 INSERT 시 DataAccessException을 409 VOTE_CONFLICT로 변환한다.
     */
    @Transactional
    public VoteToggleResult toggleVote(VoteTargetType targetType, Long targetId, Long userId, VoteType type) {
        if (targetType == null || targetId == null || userId == null || type == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }

        Optional<AppVote> existing = voteRepository.findByIdForUpdate(new AppVoteId(targetType, targetId, userId));

        int recommendDelta = 0;
        int notRecommendDelta = 0;
        VoteType myVote;

        try {
            if (existing.isEmpty()) {
                User user = userRepository.getReferenceById(userId);
                voteRepository.saveAndFlush(AppVote.of(targetType, targetId, user, type));
                myVote = type;
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = 1;
                } else {
                    notRecommendDelta = 1;
                }
            } else if (existing.get().getVoteType() == type) {
                voteRepository.delete(existing.get());
                voteRepository.flush();
                myVote = null;
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = -1;
                } else {
                    notRecommendDelta = -1;
                }
            } else {
                existing.get().changeType(type);
                voteRepository.flush();
                myVote = type;
                if (type == VoteType.RECOMMEND) {
                    recommendDelta = 1;
                    notRecommendDelta = -1;
                } else {
                    recommendDelta = -1;
                    notRecommendDelta = 1;
                }
            }
        } catch (DataAccessException e) {
            throw new BusinessException(ErrorCode.VOTE_CONFLICT);
        }

        return new VoteToggleResult(myVote, recommendDelta, notRecommendDelta);
    }

    /** 다건 대상의 추천·비추천 수치 및 현재 유저의 투표 상태 일괄 조회 */
    @Transactional(readOnly = true)
    public Map<Long, VoteSummary> getVoteStats(VoteTargetType targetType, Collection<Long> targetIds, Long userId) {
        if (targetIds == null || targetIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, int[]> countMap = new HashMap<>();
        for (Object[] row : voteRepository.countByTargetTypeAndTargetIdIn(targetType, targetIds)) {
            Long id = (Long) row[0];
            VoteType type = (VoteType) row[1];
            long cnt = ((Number) row[2]).longValue();
            int[] pair = countMap.computeIfAbsent(id, k -> new int[2]);
            if (type == VoteType.RECOMMEND) {
                pair[0] = (int) cnt;
            } else if (type == VoteType.NOT_RECOMMEND) {
                pair[1] = (int) cnt;
            }
        }

        Map<Long, VoteType> myVoteMap = new HashMap<>();
        if (userId != null) {
            for (AppVote v : voteRepository.findByTargetTypeAndTargetIdInAndUserId(targetType, targetIds, userId)) {
                myVoteMap.put(v.getId().targetId(), v.getVoteType());
            }
        }

        Map<Long, VoteSummary> result = new HashMap<>();
        for (Long id : targetIds) {
            int[] pair = countMap.getOrDefault(id, new int[2]);
            result.put(id, new VoteSummary(pair[0], pair[1], myVoteMap.get(id)));
        }
        return result;
    }

    @Transactional
    public void deleteVotesForTarget(VoteTargetType targetType, Long targetId) {
        if (targetId != null) {
            voteRepository.deleteByTarget(targetType, targetId);
        }
    }

    @Transactional
    public void deleteVotesForTargets(VoteTargetType targetType, Collection<Long> targetIds) {
        if (targetIds != null && !targetIds.isEmpty()) {
            voteRepository.deleteByTargetIn(targetType, targetIds);
        }
    }

    private void validateTargetAccessible(LoginUser loginUser, VoteTargetType targetType, Long targetId) {
        if (targetType == VoteTargetType.POST) {
            Post post = postRepository.findWithUserById(targetId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            if (post.isDeleted()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "삭제된 게시글에는 투표할 수 없습니다.");
            }
            if (post.getBoard() != null && !boardAdminService.canAccess(post.getBoard(), loginUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
            }
            return;
        }

        Comment comment = commentRepository.findWithUserById(targetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (comment.isDeleted()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "삭제된 댓글에는 투표할 수 없습니다.");
        }
        if (comment.getTargetType() == CommentTargetType.POST && comment.getTargetId() != null) {
            Post post = postRepository.findWithUserById(comment.getTargetId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            if (post.getBoard() != null && !boardAdminService.canAccess(post.getBoard(), loginUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "접근할 수 없는 게시판입니다.");
            }
        }
    }
}
