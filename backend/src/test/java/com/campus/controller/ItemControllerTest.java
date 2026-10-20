package com.campus.controller;

import com.campus.entity.Item;
import com.campus.repository.ItemRepository;
import com.campus.repository.PriceHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ItemController 单元测试
 */
@WebMvcTest(ItemController.class)
@ActiveProfiles("test")
class ItemControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean ItemRepository itemRepository;
    @MockBean PriceHistoryRepository priceHistoryRepository;

    private Item sampleItem() {
        Item it = new Item();
        it.setItemId(1L);
        it.setUserId(1L);
        it.setCategoryId(1L);
        it.setTitle("高等数学");
        it.setDescription("同济大学版");
        it.setPrice(new BigDecimal("15.00"));
        it.setOriginalPrice(new BigDecimal("52.00"));
        it.setConditionLevel(2);
        it.setStatus(1);
        it.setViewCount(128);
        return it;
    }

    // ===== 列表 / 详情 =====

    @Test
    @DisplayName("GET /api/items: 全量商品列表")
    void list_all() throws Exception {
        when(itemRepository.findAll(any(Sort.class))).thenReturn(List.of(sampleItem()));

        mockMvc.perform(get("/api/items"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].title").value("高等数学"));
    }

    @Test
    @DisplayName("GET /api/items/{id}: 商品详情（浏览量+1）")
    void detail_success() throws Exception {
        Item it = sampleItem();
        when(itemRepository.findById(1L)).thenReturn(Optional.of(it));
        when(itemRepository.save(any(Item.class))).thenReturn(it);

        mockMvc.perform(get("/api/items/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.itemId").value(1));
    }

    @Test
    @DisplayName("GET /api/items/{id}: 商品不存在 → 404")
    void detail_notFound() throws Exception {
        when(itemRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/items/999"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(404))
            .andExpect(jsonPath("$.message").value("商品不存在"));
    }

    @Test
    @DisplayName("GET /api/items/user/{userId}: 某用户发布的商品")
    void byUser() throws Exception {
        when(itemRepository.findByUserId(1L)).thenReturn(List.of(sampleItem()));

        mockMvc.perform(get("/api/items/user/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data[0].userId").value(1));
    }

    // ===== 写操作 =====

    @Test
    @DisplayName("POST /api/items: 发布商品 → 自动 status=1")
    void create() throws Exception {
        Item input = new Item();
        input.setUserId(1L);
        input.setCategoryId(2L);
        input.setTitle("罗技鼠标");
        input.setPrice(new BigDecimal("35.00"));
        input.setConditionLevel(2);

        Item saved = sampleItem();
        saved.setItemId(10L);
        saved.setTitle("罗技鼠标");
        when(itemRepository.save(any(Item.class))).thenReturn(saved);

        mockMvc.perform(post("/api/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.itemId").value(10));

        verify(itemRepository).save(any(Item.class));
    }

    @Test
    @DisplayName("PUT /api/items/{id}: 修改商品")
    void update_success() throws Exception {
        Item existing = sampleItem();
        when(itemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(itemRepository.save(any(Item.class))).thenReturn(existing);

        Item patch = new Item();
        patch.setTitle("新标题");
        mockMvc.perform(put("/api/items/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(patch)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("PUT /api/items/{id}: 商品不存在 → 404")
    void update_notFound() throws Exception {
        when(itemRepository.findById(999L)).thenReturn(Optional.empty());
        Item patch = new Item();
        mockMvc.perform(put("/api/items/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(patch)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @DisplayName("DELETE /api/items/{id}: 删除商品")
    void delete_item() throws Exception {
        doNothing().when(itemRepository).deleteById(1L);

        mockMvc.perform(delete("/api/items/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(itemRepository).deleteById(1L);
    }
}

