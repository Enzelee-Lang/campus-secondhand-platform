package com.campus.controller;

import com.campus.entity.Favorite;
import com.campus.repository.FavoriteRepository;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FavoriteController 单元测试
 */
@WebMvcTest(FavoriteController.class)
@ActiveProfiles("test")
class FavoriteControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean FavoriteRepository favoriteRepository;

    @Test
    @DisplayName("GET /api/favorites/user/{userId}: 某用户的收藏")
    void byUser() throws Exception {
        when(favoriteRepository.findByUserId(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/favorites/user/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("POST /api/favorites: 添加收藏 → 成功")
    void add_success() throws Exception {
        Favorite f = new Favorite();
        f.setUserId(1L);
        f.setItemId(1L);

        when(favoriteRepository.existsByUserIdAndItemId(1L, 1L)).thenReturn(false);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(f);

        mockMvc.perform(post("/api/favorites")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(f)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("POST /api/favorites: 重复收藏 → 失败")
    void add_duplicate() throws Exception {
        Favorite f = new Favorite();
        f.setUserId(1L);
        f.setItemId(1L);

        when(favoriteRepository.existsByUserIdAndItemId(1L, 1L)).thenReturn(true);

        mockMvc.perform(post("/api/favorites")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(f)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("已收藏该商品"));
    }

    @Test
    @DisplayName("DELETE /api/favorites/{userId}/{itemId}: 取消收藏")
    void remove() throws Exception {
        doNothing().when(favoriteRepository).deleteByUserIdAndItemId(1L, 1L);

        mockMvc.perform(delete("/api/favorites/1/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(favoriteRepository).deleteByUserIdAndItemId(1L, 1L);
    }
}

