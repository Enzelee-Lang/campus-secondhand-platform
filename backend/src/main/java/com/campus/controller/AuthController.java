package com.campus.controller;

import com.campus.common.Result;
import com.campus.dto.LoginRequest;
import com.campus.dto.RegisterRequest;
import com.campus.entity.Admin;
import com.campus.entity.User;
import com.campus.repository.AdminRepository;
import com.campus.repository.UserRepository;
import com.campus.util.Md5Util;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证接口：注册 / 登录
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    /** 用户注册 */
    @PostMapping("/register")
    public Result<User> register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return Result.error("用户名已存在");
        }
        if (userRepository.existsByStudentId(req.getStudentId())) {
            return Result.error("学号已被注册");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(Md5Util.md5(req.getPassword()));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setStudentId(req.getStudentId());
        user.setSchoolName(req.getSchoolName());
        user.setStatus(1);
        return Result.ok(userRepository.save(user));
    }

    /** 登录（type=user 用户 / type=admin 管理员） */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest req) {
        String pwd = Md5Util.md5(req.getPassword());
        Map<String, Object> map = new HashMap<>();
        if ("admin".equals(req.getType())) {
            Admin admin = adminRepository.findByUsername(req.getUsername()).orElse(null);
            if (admin == null || !admin.getPassword().equals(pwd)) {
                return Result.error("管理员账号或密码错误");
            }
            if (admin.getStatus() == 0) {
                return Result.error("该管理员已被禁用");
            }
            map.put("type", "admin");
            map.put("admin", admin);
            return Result.ok(map);
        }
        User user = userRepository.findByUsername(req.getUsername()).orElse(null);
        if (user == null || !user.getPassword().equals(pwd)) {
            return Result.error("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            return Result.error("该账号已被禁用");
        }
        map.put("type", "user");
        map.put("user", user);
        return Result.ok(map);
    }
}
