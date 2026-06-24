package com.truzcart.controller;

import com.truzcart.dto.ApiResponse;
import com.truzcart.dto.category.CategoryResponse;
import com.truzcart.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Public category browsing APIs")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Get all categories as tree structure")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @GetMapping("/flat")
    @Operation(summary = "Get all categories as flat list")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategoriesFlat() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategoriesFlat()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID with children")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryById(id)));
    }
}
