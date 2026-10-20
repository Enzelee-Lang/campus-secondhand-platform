package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Admin;
import com.campus.entity.Item;
import com.campus.entity.User;
import com.campus.repository.AdminRepository;
import com.campus.repository.ItemRepository;
import com.campus.repository.ReportRepository;
import com.campus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端统计与全局操作
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final AdminRepository adminRepository;
    private final ReportRepository reportRepository;

    /** 运营数据概览 */
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        Map<String, Object> map = new HashMap<>();
        map.put("userCount", userRepository.count());
        map.put("itemCount", itemRepository.count());
        map.put("adminCount", adminRepository.count());
        map.put("pendingReportCount", reportRepository.findByStatus(0).size());
        return Result.ok(map);
    }

    /** 全部用户（管理端） */
    @GetMapping("/users")
    public Result<List<User>> users() {
        return Result.ok(userRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime")));
    }

    /** 启用/禁用用户 */
    @PutMapping("/users/{id}/status")
    public Result<User> toggleUser(@PathVariable Long id, @RequestParam Integer status) {
        return userRepository.findById(id).map(u -> {
            u.setStatus(status);
            return Result.ok(userRepository.save(u));
        }).orElse(Result.error(404, "用户不存在"));
    }

    /** 全部商品（管理端） */
    @GetMapping("/items")
    public Result<List<Item>> items() {
        return Result.ok(itemRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime")));
    }

    /** 下架商品（管理端） */
    @PutMapping("/items/{id}/off")
    public Result<Item> offShelf(@PathVariable Long id) {
        return itemRepository.findById(id).map(i -> {
            i.setStatus(2);
            return Result.ok(itemRepository.save(i));
        }).orElse(Result.error(404, "商品不存在"));
    }
}
