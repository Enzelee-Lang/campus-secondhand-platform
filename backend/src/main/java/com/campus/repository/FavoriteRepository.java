package com.campus.repository;

import com.campus.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, com.campus.entity.FavoriteId> {

    List<Favorite> findByUserId(Long userId);

    boolean existsByUserIdAndItemId(Long userId, Long itemId);

    void deleteByUserIdAndItemId(Long userId, Long itemId);
}
