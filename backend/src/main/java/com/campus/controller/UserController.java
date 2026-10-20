package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.User;
import com.campus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户接口
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /** 用户列表 */
    @GetMapping
    public Result<List<User>> list() {
        return Result.ok(userRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime")));
    }

    /** 用户详情 */
    @GetMapping("/{id}")
    public Result<User> detail(@PathVariable Long id) {
        return userRepository.findById(id).map(Result::ok)
                .orElse(Result.error(404, "用户不存在"));
    }

    /** 按学号查询 */
    @GetMapping("/student/{studentId}")
    public Result<User> byStudentId(@PathVariable String studentId) {
        return userRepository.findByStudentId(studentId).map(Result::ok)
                .orElse(Result.error(404, "用户不存在"));
    }

    /** 修改个人信息 */
    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id, @RequestBody User patch) {
        return userRepository.findById(id).map(user -> {
            if (patch.getEmail() != null) user.setEmail(patch.getEmail());
            if (patch.getPhone() != null) user.setPhone(patch.getPhone());
            if (patch.getAvatar() != null) user.setAvatar(patch.getAvatar());
            if (patch.getSchoolName() != null) user.setSchoolName(patch.getSchoolName());
            return Result.ok(userRepository.save(user));
        }).orElse(Result.error(404, "用户不存在"));
    }
}
