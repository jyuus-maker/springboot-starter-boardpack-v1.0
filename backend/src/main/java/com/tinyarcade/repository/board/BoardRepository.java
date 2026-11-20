package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.Board;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 동적 게시판 테이블 조회·저장.
 */
public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findAllByOrderBySortOrderAscIdAsc();

    Optional<Board> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByMenuNameIgnoreCase(String menuName);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    boolean existsByMenuNameIgnoreCaseAndIdNot(String menuName, Long id);
}
