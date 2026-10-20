package com.campus.controller;

import com.campus.entity.Message;
import com.campus.repository.MessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MessageController 单元测试
 */
@WebMvcTest(MessageController.class)
@ActiveProfiles("test")
class MessageControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean MessageRepository messageRepository;

    private Message sample() {
        Message m = new Message();
        m.setMsgId(1L); m.setSenderId(1L); m.setReceiverId(2L);
        m.setContent("你好"); m.setIsRead(0);
        return m;
    }

    @Test
    @DisplayName("POST /api/messages: 发送消息 → 自动标记 isRead=0")
    void send() throws Exception {
        Message input = new Message();
        input.setSenderId(1L); input.setReceiverId(2L); input.setContent("你好");
        when(messageRepository.save(any(Message.class))).thenReturn(sample());

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input)))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("GET /api/messages/inbox/{userId}: 收件箱")
    void inbox() throws Exception {
        when(messageRepository.findByReceiverId(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/messages/inbox/1"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("GET /api/messages/outbox/{userId}: 发件箱")
    void outbox() throws Exception {
        when(messageRepository.findBySenderId(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/messages/outbox/1"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("GET /api/messages/unread/{userId}: 未读数量")
    void unread() throws Exception {
        when(messageRepository.findByReceiverIdAndIsRead(1L, 0)).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/messages/unread/1"))
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").value(1));
    }

    @Test
    @DisplayName("PUT /api/messages/{id}/read: 标记已读")
    void markRead_found() throws Exception {
        Message m = sample();
        when(messageRepository.findById(1L)).thenReturn(Optional.of(m));
        when(messageRepository.save(any(Message.class))).thenReturn(m);

        mockMvc.perform(put("/api/messages/1/read"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/messages/{id}/read: 消息不存在 → 404")
    void markRead_notFound() throws Exception {
        when(messageRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/messages/999/read"))
            .andExpect(jsonPath("$.code").value(404));
    }
}
