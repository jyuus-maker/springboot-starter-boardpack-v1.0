package com.tinyarcade.entity.board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 동적 게시판 설정 엔티티 (boards 테이블).
 */
@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "menu_name", nullable = false, unique = true, length = 50)
    private String menuName;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(name = "admin_only", nullable = false)
    private boolean adminOnly = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_write_role", nullable = false, length = 20)
    private BoardWriteRole postWriteRole = BoardWriteRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "comment_write_role", nullable = false, length = 20)
    private BoardWriteRole commentWriteRole = BoardWriteRole.USER;

    @Column(name = "system_default", nullable = false)
    private boolean systemDefault = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public static Board create(String code, String menuName, boolean visible, boolean adminOnly,
                               BoardWriteRole postWriteRole, BoardWriteRole commentWriteRole,
                               boolean systemDefault, int sortOrder) {
        Board board = new Board();
        board.code = code;
        board.menuName = menuName;
        board.adminOnly = adminOnly;
        board.visible = !adminOnly && visible;
        board.postWriteRole = postWriteRole;
        board.commentWriteRole = commentWriteRole;
        board.systemDefault = systemDefault;
        board.sortOrder = sortOrder;
        return board;
    }

    public void update(String code, String menuName, boolean visible, boolean adminOnly,
                       BoardWriteRole postWriteRole, BoardWriteRole commentWriteRole) {
        if (!this.systemDefault) {
            this.code = code;
            this.adminOnly = adminOnly;
            this.visible = !adminOnly && visible;
        } else {
            this.visible = true;
            this.adminOnly = false;
        }
        this.menuName = menuName;
        this.postWriteRole = postWriteRole;
        this.commentWriteRole = commentWriteRole;
    }

    public void changeVisibility(boolean visible) {
        if (!this.systemDefault && !this.adminOnly) {
            this.visible = visible;
        }
    }

    public void changeAdminOnly(boolean adminOnly) {
        if (!this.systemDefault) {
            this.adminOnly = adminOnly;
            if (adminOnly) {
                this.visible = false;
            }
        }
    }
}
