package com.campus.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏表 t_favorite
 */
@Data
@Entity
@Table(name = "t_favorite")
@IdClass(FavoriteId.class)
public class Favorite {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
    }
}
