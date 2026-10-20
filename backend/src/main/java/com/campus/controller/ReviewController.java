package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Review;
import com.campus.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 评价接口
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;

    /** 某用户收到的评价 */
    @GetMapping("/target/{userId}")
    public Result<List<Review>> byTarget(@PathVariable Long userId) {
        return Result.ok(reviewRepository.findByTargetUserId(userId));
    }

    /** 某商品的评价 */
    @GetMapping("/item/{itemId}")
    public Result<List<Review>> byItem(@PathVariable Long itemId) {
        return Result.ok(reviewRepository.findByItemId(itemId));
    }

    /** 发表评价 */
    @PostMapping
    public Result<Review> create(@RequestBody Review review) {
        return Result.ok(reviewRepository.save(review));
    }

    /** 卖家回复评价 */
    @PutMapping("/{id}/reply")
    public Result<Review> reply(@PathVariable Long id, @RequestParam String reply) {
        return reviewRepository.findById(id).map(r -> {
            r.setReply(reply);
            return Result.ok(reviewRepository.save(r));
        }).orElse(Result.error(404, "评价不存在"));
    }
}
