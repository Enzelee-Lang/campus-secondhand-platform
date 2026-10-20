package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.User;
import com.campus.entity.Wanted;
import com.campus.repository.UserRepository;
import com.campus.repository.WantedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 求购信息接口
 */
@RestController
@RequestMapping("/api/wanteds")
@RequiredArgsConstructor
public class WantedController {

    private final WantedRepository wantedRepository;
    private final UserRepository userRepository;

    /** 求购列表（默认只返回活跃 status=1；all=true 时返回全部） */
    @GetMapping
    public Result<List<Map<String, Object>>> list(@RequestParam(required = false) Boolean all) {
        List<Wanted> list = Boolean.TRUE.equals(all)
                ? wantedRepository.findAllByOrderByCreateTimeDesc()
                : wantedRepository.findByStatusOrderByCreateTimeDesc(1);

        // 批量查发布人，填充发布人名字 + 手机号
        List<Long> publisherIds = list.stream().map(Wanted::getPublisherId).distinct().toList();
        Map<Long, User> userMap = userRepository.findAllById(publisherIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u, (a, b) -> a));

        List<Map<String, Object>> vo = list.stream().map(w -> {
            Map<String, Object> m = new HashMap<>();
            User u = userMap.get(w.getPublisherId());
            m.put("wantedId", w.getWantedId());
            m.put("publisherId", w.getPublisherId());
            m.put("publisher", u != null ? u.getUsername() : "未知");
            m.put("publisherPhone", u != null ? u.getPhone() : null);
            m.put("title", w.getTitle());
            m.put("description", w.getDescription());
            m.put("budget", w.getBudget());
            m.put("location", w.getLocation());
            m.put("status", w.getStatus());
            m.put("createTime", w.getCreateTime());
            return m;
        }).collect(Collectors.toList());

        return Result.ok(vo);
    }

    /** 我发布的求购 */
    @GetMapping("/mine/{publisherId}")
    public Result<List<Map<String, Object>>> mine(@PathVariable Long publisherId) {
        List<Wanted> list = wantedRepository.findByPublisherIdOrderByCreateTimeDesc(publisherId);
        User u = userRepository.findById(publisherId).orElse(null);
        String name = u != null ? u.getUsername() : "未知";
        String phone = u != null ? u.getPhone() : null;

        List<Map<String, Object>> vo = list.stream().map(w -> {
            Map<String, Object> m = new HashMap<>();
            m.put("wantedId", w.getWantedId());
            m.put("publisherId", w.getPublisherId());
            m.put("publisher", name);
            m.put("publisherPhone", phone);
            m.put("title", w.getTitle());
            m.put("description", w.getDescription());
            m.put("budget", w.getBudget());
            m.put("location", w.getLocation());
            m.put("status", w.getStatus());
            m.put("createTime", w.getCreateTime());
            return m;
        }).collect(Collectors.toList());

        return Result.ok(vo);
    }

    /** 发布求购 */
    @PostMapping
    public Result<Wanted> create(@RequestBody Wanted wanted) {
        if (wanted.getPublisherId() == null) return Result.error("缺少发布人");
        if (wanted.getTitle() == null || wanted.getTitle().isBlank()) return Result.error("标题不能为空");
        if (wanted.getBudget() == null) return Result.error("预算不能为空");
        wanted.setStatus(1);
        return Result.ok(wantedRepository.save(wanted));
    }

    /** 关闭（软删除） */
    @PutMapping("/{id}/close")
    public Result<Void> close(@PathVariable Long id) {
        wantedRepository.findById(id).ifPresent(w -> {
            w.setStatus(0);
            wantedRepository.save(w);
        });
        return Result.ok();
    }

    /** 硬删除（仅发布人或管理员可调用，这里简化） */
    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Long id) {
        wantedRepository.deleteById(id);
        return Result.ok();
    }
}
