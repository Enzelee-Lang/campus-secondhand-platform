package com.campus.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 举报表 t_report
 */
@Data
@Entity
@Table(name = "t_report")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "reported_user_id")
    private Long reportedUserId;

    @Column(name = "reason", nullable = false, length = 200)
    private String reason;

    @Column(name = "evidence", length = 1000)
    private String evidence;

    /** 0-待处理 1-已处理 2-已驳回 */
    @Column(name = "status")
    private Integer status = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
    }
}
