package com.tinyarcade.dto.vote;

import com.tinyarcade.entity.vote.VoteTargetType;
import com.tinyarcade.entity.vote.VoteType;
import jakarta.validation.constraints.NotNull;

/**
 * 추천·비추천 요청 DTO.
 */
public record VoteRequest(
        @NotNull(message = "투표 대상을 지정해 주세요.")
        VoteTargetType targetType,

        @NotNull(message = "대상 ID를 지정해 주세요.")
        Long targetId,

        @NotNull(message = "투표 유형을 선택해 주세요.")
        VoteType voteType
) {
}
