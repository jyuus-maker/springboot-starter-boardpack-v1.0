package com.tinyarcade.repository.board;

import com.tinyarcade.entity.board.AppInitFlag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppInitFlagRepository extends JpaRepository<AppInitFlag, String> {
}
