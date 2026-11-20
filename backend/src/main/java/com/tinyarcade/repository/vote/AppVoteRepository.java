package com.tinyarcade.repository.vote;

import com.tinyarcade.entity.vote.AppVote;
import com.tinyarcade.entity.vote.AppVoteId;
import com.tinyarcade.entity.vote.VoteTargetType;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * app_votes 조회·저장·집계·정리.
 */
public interface AppVoteRepository extends JpaRepository<AppVote, AppVoteId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from AppVote v where v.id = :id")
    Optional<AppVote> findByIdForUpdate(@Param("id") AppVoteId id);

    @Query("""
            select v.id.targetId, v.voteType, count(v)
            from AppVote v
            where v.id.targetType = :targetType and v.id.targetId in :targetIds
            group by v.id.targetId, v.voteType
            """)
    List<Object[]> countByTargetTypeAndTargetIdIn(@Param("targetType") VoteTargetType targetType,
                                                  @Param("targetIds") Collection<Long> targetIds);

    @Query("""
            select v from AppVote v
            where v.id.targetType = :targetType
              and v.id.targetId in :targetIds
              and v.id.userId = :userId
            """)
    List<AppVote> findByTargetTypeAndTargetIdInAndUserId(@Param("targetType") VoteTargetType targetType,
                                                         @Param("targetIds") Collection<Long> targetIds,
                                                         @Param("userId") Long userId);

    @Modifying
    @Query("delete from AppVote v where v.id.targetType = :targetType and v.id.targetId = :targetId")
    void deleteByTarget(@Param("targetType") VoteTargetType targetType,
                        @Param("targetId") Long targetId);

    @Modifying
    @Query("delete from AppVote v where v.id.targetType = :targetType and v.id.targetId in :targetIds")
    void deleteByTargetIn(@Param("targetType") VoteTargetType targetType,
                          @Param("targetIds") Collection<Long> targetIds);
}
