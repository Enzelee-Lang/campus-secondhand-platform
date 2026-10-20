package com.campus.repository;

import com.campus.entity.Item;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByUserId(Long userId);

    List<Item> findByCategoryId(Long categoryId);

    List<Item> findByStatus(Integer status);

    // ============== 游标分页（按 createTime 倒序，cursor 即上一页最后一条的 createTime） ==============

    /**
     * 游标分页：全量商品，按 createTime 倒序，取 createTime 严格小于 cursor 的前 pageSize 条。
     * <p>cursor 传 null 表示首页（不附带时间过滤，但用最大时间作为基准，使首屏包含全部最新记录）。
     */
    @Query("SELECT i FROM Item i WHERE (:cursor IS NULL OR i.createTime < :cursor) ORDER BY i.createTime DESC")
    List<Item> findByCursor(@Param("cursor") LocalDateTime cursor, Pageable pageable);

    /**
     * 游标分页：按 categoryId 过滤 + 游标。
     */
    @Query("SELECT i FROM Item i WHERE i.categoryId = :categoryId AND (:cursor IS NULL OR i.createTime < :cursor) ORDER BY i.createTime DESC")
    List<Item> findByCategoryIdAndCursor(@Param("categoryId") Long categoryId,
                                         @Param("cursor") LocalDateTime cursor,
                                         Pageable pageable);

    /**
     * 游标分页：按关键字（标题或描述模糊匹配）+ 游标。
     */
    @Query("SELECT i FROM Item i WHERE (:cursor IS NULL OR i.createTime < :cursor) AND " +
           "(LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY i.createTime DESC")
    List<Item> findByKeywordAndCursor(@Param("keyword") String keyword,
                                      @Param("cursor") LocalDateTime cursor,
                                      Pageable pageable);
}
