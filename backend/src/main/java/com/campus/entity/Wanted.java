package com.campus.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 求购信息表 t_wanted
 */
@Data
@Entity
@Table(name = "t_wanted")
public class Wanted {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wanted_id")
    private Long wantedId;

    @Column(name = "publisher_id", nullable = false)
    private Long publisherId;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "budget", nullable = false, precision = 10, scale = 2)
    private BigDecimal budget;

    @Column(name = "location", length = 100)
    private String location;

    /** 1-活跃 0-已关闭 */
    @Column(name = "status", nullable = false)
    private Integer status = 1;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
    }
}
