package com.tinyarcade.entity.board;

import com.tinyarcade.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * 게시글 엔티티 (00_project_main_spec-v1.2 §8 posts 테이블 1:1).
 */
@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", length = 20)
    private BoardType boardType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_name", length = 50)
    private String guestName;

    @Column(name = "guest_password_hash", length = 120)
    private String guestPasswordHash;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(nullable = false)
    private boolean pinned = false;

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

    public static Post createForUser(Board board, User user, String title, String content) {
        Post post = new Post();
        post.board = board;
        post.user = user;
        post.title = title;
        post.content = content;
        return post;
    }

    public static Post createForGuest(Board board, String guestName, String guestPasswordHash,
                                      String title, String content) {
        Post post = new Post();
        post.board = board;
        post.guestName = guestName;
        post.guestPasswordHash = guestPasswordHash;
        post.title = title;
        post.content = content;
        return post;
    }

    public void update(Board board, String title, String content) {
        this.board = board;
        this.title = title;
        this.content = content;
    }

    public void assignBoard(Board board) {
        this.board = board;
    }

    public void updatePinned(boolean pinned) {
        this.pinned = pinned;
    }

    public void markDeleted() {
        this.deleted = true;
        this.pinned = false;
        this.title = "";
        this.content = "";
        this.guestName = null;
        this.guestPasswordHash = null;
    }
}
