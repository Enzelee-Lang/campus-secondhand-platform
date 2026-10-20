package com.campus.repository;

import com.campus.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetUserId(Long targetUserId);

    List<Review> findByReviewerId(Long reviewerId);

    List<Review> findByItemId(Long itemId);
}
