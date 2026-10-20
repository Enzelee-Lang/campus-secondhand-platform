package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Message;
import com.campus.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 站内消息接口
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;

    /** 发送消息 */
    @PostMapping
    public Result<Message> send(@RequestBody Message message) {
        message.setIsRead(0);
        return Result.ok(messageRepository.save(message));
    }

    /** 我的收件箱 */
    @GetMapping("/inbox/{userId}")
    public Result<List<Message>> inbox(@PathVariable Long userId) {
        return Result.ok(messageRepository.findByReceiverId(userId));
    }

    /** 我的发件箱 */
    @GetMapping("/outbox/{userId}")
    public Result<List<Message>> outbox(@PathVariable Long userId) {
        return Result.ok(messageRepository.findBySenderId(userId));
    }

    /** 未读数量 */
    @GetMapping("/unread/{userId}")
    public Result<Long> unread(@PathVariable Long userId) {
        return Result.ok(messageRepository.findByReceiverIdAndIsRead(userId, 0).stream().count());
    }

    /** 标记已读 */
    @PutMapping("/{id}/read")
    public Result<Message> markRead(@PathVariable Long id) {
        return messageRepository.findById(id).map(m -> {
            m.setIsRead(1);
            return Result.ok(messageRepository.save(m));
        }).orElse(Result.error(404, "消息不存在"));
    }
}
