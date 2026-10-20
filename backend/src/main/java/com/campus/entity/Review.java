package com.campus.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评价表 t_review
 */
@Data
@Entity
@Table(name = "t_review")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    /** 评分 1-5 */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    @Column(name = "reply", length = 500)
    private String reply;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
    }
}
