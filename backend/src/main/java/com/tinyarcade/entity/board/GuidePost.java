package com.tinyarcade.entity.board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 사용자 가이드 목게시물 엔티티 (posts 시퀀스와 분리된 ex1, ex2, ex3... 관리).
 */
@Entity
@Table(name = "guide_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GuidePost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "guide_number", nullable = false, unique = true)
    private int guideNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static GuidePost create(int guideNumber, Board board, String title, String content) {
        GuidePost post = new GuidePost();
        post.guideNumber = guideNumber;
        post.board = board;
        post.title = title;
        post.content = content;
        return post;
    }

    public void update(Board board, String title, String content) {
        this.board = board;
        this.title = title;
        this.content = content;
    }

    public String getDisplayId() {
        return "ex" + guideNumber;
    }
}
