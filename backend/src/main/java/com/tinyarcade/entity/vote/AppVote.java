package com.tinyarcade.entity.vote;

import com.tinyarcade.entity.user.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.domain.Persistable;

/**
 * 추천·비추천 표 엔티티 (app_votes).
 */
@Entity
@Table(name = "app_votes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppVote implements Persistable<AppVoteId> {

    @EmbeddedId
    private AppVoteId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false, length = 20)
    private VoteType voteType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static AppVote of(VoteTargetType targetType, Long targetId, User user, VoteType voteType) {
        AppVote vote = new AppVote();
        vote.id = new AppVoteId(targetType, targetId, user.getId());
        vote.user = user;
        vote.voteType = voteType;
        return vote;
    }

    public void changeType(VoteType voteType) {
        this.voteType = voteType;
    }

    @Override
    public boolean isNew() {
        return createdAt == null;
    }
}
