package com.campus.controller;

import com.campus.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 系统根信息
 */
@RestController
public class SystemController {

    @GetMapping("/")
    public Result<Map<String, Object>> home() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("system", "校园二手物品交易系统 后端服务");
        map.put("version", "1.0.0");
        map.put("framework", "Spring Boot 3 + Spring Data JPA + MySQL");
        map.put("serverTime", LocalDateTime.now());
        map.put("docs", "/swagger-ui/index.html");
        return Result.ok(map);
    }

    @GetMapping("/api/health")
    public Result<Map<String, Object>> health() {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "UP");
        map.put("serverTime", LocalDateTime.now());
        return Result.ok(map);
    }
}
