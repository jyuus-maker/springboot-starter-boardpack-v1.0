package com.tinyarcade.dto.vote;

import com.tinyarcade.entity.vote.VoteType;

/**
 * 추천·비추천 응답 DTO (내 투표 상태 + 집계 수치).
 */
public record VoteResponse(
        VoteType myVote,
        int recommendCount,
        int notRecommendCount
) {
}
