package com.tinyarcade.entity.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.io.Serializable;

/**
 * app_votes 테이블의 복합 기본 키 (대상 구분 + 대상 ID + 유저 ID).
 */
@Embeddable
public record AppVoteId(
        @Enumerated(EnumType.STRING)
        @Column(name = "target_type", length = 20)
        VoteTargetType targetType,

        @Column(name = "target_id")
        Long targetId,

        @Column(name = "user_id")
        Long userId
) implements Serializable {
}
