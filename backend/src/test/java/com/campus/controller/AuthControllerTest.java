package com.campus.controller;

import com.campus.dto.LoginRequest;
import com.campus.dto.RegisterRequest;
import com.campus.entity.Admin;
import com.campus.entity.User;
import com.campus.repository.AdminRepository;
import com.campus.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 单元测试（登录 / 注册 + 参数化边界值）
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean UserRepository userRepository;
    @MockBean AdminRepository adminRepository;

    // ===== 注册 =====

    @Test
    @DisplayName("POST /api/auth/register: 新用户注册成功")
    void register_success() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("newuser");
        req.setPassword("123456");
        req.setStudentId("20238111199");
        req.setEmail("new@campus.edu.cn");

        User saved = new User();
        saved.setUserId(99L);
        saved.setUsername("newuser");
        saved.setStudentId("20238111199");
        saved.setEmail("new@campus.edu.cn");
        saved.setStatus(1);

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByStudentId("20238111199")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    @DisplayName("POST /api/auth/register: 用户名已存在 → 失败")
    void register_usernameExists() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("admin");
        req.setPassword("123456");
        req.setStudentId("20238111200");

        when(userRepository.existsByUsername("admin")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("用户名已存在"));
    }

    @Test
    @DisplayName("POST /api/auth/register: 学号已被注册 → 失败")
    void register_studentIdExists() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("unique");
        req.setPassword("123456");
        req.setStudentId("20238111101");

        when(userRepository.existsByUsername("unique")).thenReturn(false);
        when(userRepository.existsByStudentId("20238111101")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("学号已被注册"));
    }

    // ===== 登录（用户） =====

    @Test
    @DisplayName("POST /api/auth/login: 普通用户登录成功")
    void login_user_success() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("张三");
        req.setPassword("123456");
        req.setType("user");

        User u = new User();
        u.setUserId(1L);
        u.setUsername("张三");
        u.setPassword("e10adc3949ba59abbe56e057f20f883e");
        u.setStatus(1);

        when(userRepository.findByUsername("张三")).thenReturn(Optional.of(u));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.type").value("user"))
            .andExpect(jsonPath("$.data.user.username").value("张三"));
    }

    @Test
    @DisplayName("POST /api/auth/login: 用户密码错误 → 失败")
    void login_user_wrongPassword() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("张三");
        req.setPassword("wrong");
        req.setType("user");

        User u = new User();
        u.setUserId(1L);
        u.setUsername("张三");
        u.setPassword("e10adc3949ba59abbe56e057f20f883e");
        u.setStatus(1);

        when(userRepository.findByUsername("张三")).thenReturn(Optional.of(u));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }

    @Test
    @DisplayName("POST /api/auth/login: 不存在的用户 → 失败")
    void login_user_notFound() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("nobody");
        req.setPassword("123456");
        req.setType("user");

        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }

    @Test
    @DisplayName("POST /api/auth/login: 被禁用的用户 → 失败")
    void login_user_disabled() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("张三");
        req.setPassword("123456");
        req.setType("user");

        User u = new User();
        u.setUserId(1L);
        u.setUsername("张三");
        u.setPassword("e10adc3949ba59abbe56e057f20f883e");
        u.setStatus(0);

        when(userRepository.findByUsername("张三")).thenReturn(Optional.of(u));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("该账号已被禁用"));
    }

    // ===== 登录（管理员） =====

    @Test
    @DisplayName("POST /api/auth/login: 管理员登录成功")
    void login_admin_success() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin");
        req.setPassword("123456");
        req.setType("admin");

        Admin a = new Admin();
        a.setAdminId(1L);
        a.setUsername("admin");
        a.setPassword("e10adc3949ba59abbe56e057f20f883e");
        a.setStatus(1);

        when(adminRepository.findByUsername("admin")).thenReturn(Optional.of(a));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.type").value("admin"))
            .andExpect(jsonPath("$.data.admin.username").value("admin"));
    }

    @Test
    @DisplayName("POST /api/auth/login: 管理员不存在 → 失败")
    void login_admin_notFound() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("ghost");
        req.setPassword("123456");
        req.setType("admin");

        when(adminRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.message").value("管理员账号或密码错误"));
    }

    // ===== 参数化测试：登录边界值 =====

    @ParameterizedTest
    @DisplayName("POST /api/auth/login: 密码长度边界值")
    @ValueSource(strings = {"", "1", "12345678901234567890123456789012"}) // 空串、1位、32位超长
    void login_passwordBoundary(String password) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("张三");
        req.setPassword(password);
        req.setType("user");

        User u = new User();
        u.setUserId(1L);
        u.setUsername("张三");
        u.setPassword("e10adc3949ba59abbe56e057f20f883e");
        u.setStatus(1);

        when(userRepository.findByUsername("张三")).thenReturn(Optional.of(u));

        // 空串和超长都不等于 MD5("123456")，应失败
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500));
    }

    @ParameterizedTest
    @DisplayName("POST /api/auth/login: 用户名边界值")
    @ValueSource(strings = {"", "a", "张三@12345", "中文用户名测试"})
    void login_usernameBoundary(String username) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername(username);
        req.setPassword("123456");
        req.setType("user");

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(500));
    }

    @ParameterizedTest
    @DisplayName("POST /api/auth/login: 非法 type → 走 user 分支也找不到")
    @ValueSource(strings = {"", "guest", "super", "null"})
    void login_invalidType(String type) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("张三");
        req.setPassword("123456");
        req.setType(type);

        when(userRepository.findByUsername("张三")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isOk()); // 不抛异常即可
    }
}
