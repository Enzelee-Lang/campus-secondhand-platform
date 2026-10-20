package com.campus.controller;

import com.campus.common.Result;
import com.campus.entity.Category;
import com.campus.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类接口
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    /** 分类列表 */
    @GetMapping
    public Result<List<Category>> list() {
        return Result.ok(categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder")));
    }

    /** 新增分类（管理端） */
    @PostMapping
    public Result<Category> create(@RequestBody Category category) {
        return Result.ok(categoryRepository.save(category));
    }

    /** 删除分类（管理端） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return Result.ok();
    }
}
