package com.campus.controller;

import com.campus.entity.User;
import com.campus.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Sort;
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
 * UserController 单元测试
 */
@WebMvcTest(UserController.class)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean UserRepository userRepository;

    private User sample() {
        User u = new User();
        u.setUserId(1L); u.setUsername("张三"); u.setStudentId("20238111101");
        u.setEmail("zhangsan@campus.edu.cn"); u.setPhone("13800000001"); u.setStatus(1);
        return u;
    }

    @Test
    @DisplayName("GET /api/users: 用户列表")
    void list() throws Exception {
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of(sample()));
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].username").value("张三"));
    }

    @Test
    @DisplayName("GET /api/users/{id}: 用户详情")
    void detail_found() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sample()));
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.userId").value(1));
    }

    @Test
    @DisplayName("GET /api/users/{id}: 用户不存在 → 404")
    void detail_notFound() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/users/999"))
            .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("GET /api/users/student/{sid}: 按学号查询")
    void byStudentId_found() throws Exception {
        when(userRepository.findByStudentId("20238111101")).thenReturn(Optional.of(sample()));
        mockMvc.perform(get("/api/users/student/20238111101"))
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.username").value("张三"));
    }

    @Test
    @DisplayName("GET /api/users/student/{sid}: 学号不存在 → 404")
    void byStudentId_notFound() throws Exception {
        when(userRepository.findByStudentId("99999")).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/users/student/99999"))
            .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("PUT /api/users/{id}: 修改邮箱/头像")
    void update_email() throws Exception {
        User u = sample();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any(User.class))).thenReturn(u);

        User patch = new User();
        patch.setEmail("new@campus.edu.cn");
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(patch)))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/users/{id}: 用户不存在 → 404")
    void update_notFound() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/users/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new User())))
            .andExpect(jsonPath("$.code").value(404));
    }
}
