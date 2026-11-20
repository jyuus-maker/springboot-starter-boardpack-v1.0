package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.GuideComment;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 사용자 가이드 목댓글·목대댓글 조회·저장.
 */
public interface GuideCommentRepository extends JpaRepository<GuideComment, Long> {

    @EntityGraph(attributePaths = "parent")
    List<GuideComment> findByGuidePostIdOrderByIdAsc(Long guidePostId);

    @EntityGraph(attributePaths = "parent")
    List<GuideComment> findByGuidePostIdIn(Collection<Long> guidePostIds);

    @Modifying(clearAutomatically = true)
    @Query("delete from GuideComment gc where gc.guidePost.id = :guidePostId and gc.parent is not null")
    int deleteRepliesByGuidePostId(@Param("guidePostId") Long guidePostId);

    @Modifying(clearAutomatically = true)
    @Query("delete from GuideComment gc where gc.guidePost.id = :guidePostId")
    int deleteAllByGuidePostId(@Param("guidePostId") Long guidePostId);
}
