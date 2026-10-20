package com.campus.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 收藏表复合主键 (user_id, item_id)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteId implements Serializable {

    private Long userId;
    private Long itemId;
}
