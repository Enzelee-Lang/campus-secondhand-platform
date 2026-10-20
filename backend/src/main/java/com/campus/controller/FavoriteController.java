package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Favorite;
import com.campus.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 收藏接口
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;

    /** 某用户的收藏 */
    @GetMapping("/user/{userId}")
    public Result<List<Favorite>> byUser(@PathVariable Long userId) {
        return Result.ok(favoriteRepository.findByUserId(userId));
    }

    /** 添加收藏 */
    @PostMapping
    public Result<Favorite> add(@RequestBody Favorite favorite) {
        if (favoriteRepository.existsByUserIdAndItemId(favorite.getUserId(), favorite.getItemId())) {
            return Result.error("已收藏该商品");
        }
        return Result.ok(favoriteRepository.save(favorite));
    }

    /** 取消收藏 */
    @DeleteMapping("/{userId}/{itemId}")
    public Result<Void> remove(@PathVariable Long userId, @PathVariable Long itemId) {
        favoriteRepository.deleteByUserIdAndItemId(userId, itemId);
        return Result.ok();
    }
}
