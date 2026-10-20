package com.campus.controller;

import com.campus.entity.Category;
import com.campus.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CategoryController 单元测试
 */
@WebMvcTest(CategoryController.class)
@ActiveProfiles("test")
class CategoryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean CategoryRepository categoryRepository;

    @Test
    @DisplayName("GET /api/categories: 分类列表")
    void list() throws Exception {
        when(categoryRepository.findAll(any(Sort.class))).thenReturn(List.of());
        mockMvc.perform(get("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("POST /api/categories: 新增分类")
    void create() throws Exception {
        Category c = new Category();
        c.setCategoryId(1L);
        c.setName("教材书籍");
        when(categoryRepository.save(any(Category.class))).thenReturn(c);

        Category input = new Category();
        input.setName("新分类");
        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input)))
            .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("DELETE /api/categories/{id}: 删除分类")
    void delete_category() throws Exception {
        doNothing().when(categoryRepository).deleteById(1L);
        mockMvc.perform(delete("/api/categories/1"))
            .andExpect(jsonPath("$.code").value(200));
        verify(categoryRepository).deleteById(1L);
    }
}
