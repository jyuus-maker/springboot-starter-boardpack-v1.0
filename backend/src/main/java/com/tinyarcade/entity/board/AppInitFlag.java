package com.tinyarcade.entity.board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 초기 데이터 시딩 완료 여부 기록용 플래그 테이블.
 */
@Entity
@Table(name = "app_init_flags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppInitFlag {

    @Id
    @Column(name = "flag_key", length = 60)
    private String flagKey;

    @Column(nullable = false)
    private boolean initialized;

    public static AppInitFlag done(String key) {
        AppInitFlag flag = new AppInitFlag();
        flag.flagKey = key;
        flag.initialized = true;
        return flag;
    }
}
