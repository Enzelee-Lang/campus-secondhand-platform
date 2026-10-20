package com.campus.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内消息表 t_message
 */
@Data
@Entity
@Table(name = "t_message")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "msg_id")
    private Long msgId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    /** 1-私聊 2-系统通知 */
    @Column(name = "msg_type")
    private Integer msgType = 1;

    /** 0-未读 1-已读 */
    @Column(name = "is_read")
    private Integer isRead = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
    }
}
