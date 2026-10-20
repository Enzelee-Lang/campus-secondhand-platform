package com.campus.controller;

import com.campus.entity.Review;
import com.campus.repository.ReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ReviewController 单元测试
 */
@WebMvcTest(ReviewController.class)
@ActiveProfiles("test")
class ReviewControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean ReviewRepository reviewRepository;

    private Review sample() {
        Review r = new Review();
        r.setReviewId(1L);
        r.setReviewerId(2L);
        r.setTargetUserId(1L);
        r.setItemId(1L);
        r.setRating(5);
        r.setContent("书很新，发货快");
        r.setReply(null);
        return r;
    }

    @Test
    @DisplayName("GET /api/reviews/target/{userId}: 某用户收到的评价")
    void byTarget() throws Exception {
        when(reviewRepository.findByTargetUserId(1L)).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/reviews/target/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].targetUserId").value(1));
    }

    @Test
    @DisplayName("GET /api/reviews/item/{itemId}: 某商品的评价")
    void byItem() throws Exception {
        when(reviewRepository.findByItemId(1L)).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/reviews/item/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].itemId").value(1));
    }

    @Test
    @DisplayName("POST /api/reviews: 发表评价")
    void create() throws Exception {
        Review input = new Review();
        input.setReviewerId(2L);
        input.setTargetUserId(1L);
        input.setItemId(1L);
        input.setRating(4);
        input.setContent("不错");

        Review saved = sample();
        saved.setRating(4);
        saved.setContent("不错");
        when(reviewRepository.save(any(Review.class))).thenReturn(saved);

        mockMvc.perform(post("/api/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.content").value("不错"));
    }

    @Test
    @DisplayName("PUT /api/reviews/{id}/reply: 卖家回复评价")
    void reply_success() throws Exception {
        Review existing = sample();
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(reviewRepository.save(any(Review.class))).thenReturn(existing);

        mockMvc.perform(put("/api/reviews/1/reply")
                .param("reply", "谢谢支持"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/reviews/{id}/reply: 评价不存在 → 404")
    void reply_notFound() throws Exception {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/reviews/999/reply")
                .param("reply", "xxx"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(404))
            .andExpect(jsonPath("$.message").value("评价不存在"));
    }
}

