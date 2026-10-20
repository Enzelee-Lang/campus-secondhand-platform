package com.campus.controller;

import com.campus.entity.Item;
import com.campus.entity.User;
import com.campus.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminController 单元测试
 */
@WebMvcTest(AdminController.class)
@ActiveProfiles("test")
class AdminControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean UserRepository userRepository;
    @MockBean ItemRepository itemRepository;
    @MockBean AdminRepository adminRepository;
    @MockBean ReportRepository reportRepository;

    @Test
    @DisplayName("GET /api/admin/stats: 运营统计")
    void stats() throws Exception {
        when(userRepository.count()).thenReturn(3L);
        when(itemRepository.count()).thenReturn(6L);
        when(adminRepository.count()).thenReturn(1L);
        when(reportRepository.findByStatus(0)).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/stats"))
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.userCount").value(3))
            .andExpect(jsonPath("$.data.itemCount").value(6));
    }

    @Test
    @DisplayName("GET /api/admin/users: 全部用户")
    void users() throws Exception {
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of());
        mockMvc.perform(get("/api/admin/users"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/status: 启用/禁用用户")
    void toggleUser_found() throws Exception {
        User u = new User(); u.setUserId(1L); u.setStatus(1);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any(User.class))).thenReturn(u);

        mockMvc.perform(put("/api/admin/users/1/status").param("status", "0"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/status: 用户不存在 → 404")
    void toggleUser_notFound() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/admin/users/999/status").param("status", "0"))
            .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("GET /api/admin/items: 全部商品")
    void items() throws Exception {
        when(itemRepository.findAll(any(Sort.class))).thenReturn(List.of());
        mockMvc.perform(get("/api/admin/items"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/admin/items/{id}/off: 下架商品")
    void offShelf_found() throws Exception {
        Item it = new Item(); it.setItemId(1L); it.setStatus(1);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(it));
        when(itemRepository.save(any(Item.class))).thenReturn(it);

        mockMvc.perform(put("/api/admin/items/1/off"))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/admin/items/{id}/off: 商品不存在 → 404")
    void offShelf_notFound() throws Exception {
        when(itemRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/admin/items/999/off"))
            .andExpect(jsonPath("$.code").value(404));
    }
}
