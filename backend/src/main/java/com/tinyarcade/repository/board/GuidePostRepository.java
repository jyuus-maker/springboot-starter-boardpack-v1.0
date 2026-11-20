package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.GuidePost;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 사용자 가이드 목게시물 조회·저장.
 */
public interface GuidePostRepository extends JpaRepository<GuidePost, Long> {

    @EntityGraph(attributePaths = "board")
    List<GuidePost> findByBoardIdInOrderByGuideNumberDesc(Collection<Long> boardIds);

    @EntityGraph(attributePaths = "board")
    List<GuidePost> findByBoardIdOrderByGuideNumberDesc(Long boardId);

    @EntityGraph(attributePaths = "board")
    Optional<GuidePost> findWithBoardByGuideNumber(int guideNumber);

    void deleteByBoardId(Long boardId);
}
