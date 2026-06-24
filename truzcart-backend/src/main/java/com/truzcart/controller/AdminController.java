package com.truzcart.controller;

import com.truzcart.dto.ApiResponse;
import com.truzcart.dto.PagedResponse;
import com.truzcart.dto.admin.DashboardResponse;
import com.truzcart.dto.category.CategoryRequest;
import com.truzcart.dto.category.CategoryResponse;
import com.truzcart.dto.coupon.CouponRequest;
import com.truzcart.dto.coupon.CouponResponse;
import com.truzcart.dto.order.OrderResponse;
import com.truzcart.dto.product.ProductRequest;
import com.truzcart.dto.product.ProductResponse;
import com.truzcart.dto.review.ReviewResponse;
import com.truzcart.dto.user.UserResponse;
import com.truzcart.entity.enums.OrderStatus;
import com.truzcart.security.CurrentUser;
import com.truzcart.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin management APIs (ROLE_ADMIN required)")
public class AdminController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;
    private final DashboardService dashboardService;
    private final CouponService couponService;
    private final ReviewService reviewService;
    private final UserService userService;
    private final CurrentUser currentUser;

    public AdminController(ProductService productService, CategoryService categoryService,
                           OrderService orderService, DashboardService dashboardService,
                           CouponService couponService, ReviewService reviewService,
                           UserService userService, CurrentUser currentUser) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.orderService = orderService;
        this.dashboardService = dashboardService;
        this.couponService = couponService;
        this.reviewService = reviewService;
        this.userService = userService;
        this.currentUser = currentUser;
    }

    // ===================== Dashboard =====================

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard data")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard()));
    }

    // ===================== Products =====================

    @PostMapping("/products")
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", productService.createProduct(request)));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", productService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted"));
    }

    @PatchMapping("/products/{id}/stock")
    @Operation(summary = "Update product stock quantity")
    public ResponseEntity<ApiResponse<ProductResponse>> updateStock(
            @PathVariable Long id, @RequestParam int quantity, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.updateStock(id, quantity, reason, currentUser.getUser())));
    }

    @PatchMapping("/products/{id}/status")
    @Operation(summary = "Toggle product active/inactive status")
    public ResponseEntity<ApiResponse<ProductResponse>> toggleProductStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.toggleProductStatus(id)));
    }

    // ===================== Categories =====================

    @PostMapping("/categories")
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created", categoryService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", categoryService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete a category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted"));
    }

    // ===================== Orders =====================

    @GetMapping("/orders")
    @Operation(summary = "Get all orders with optional status filter")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOrders(page, size, status)));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get order details by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderByIdAdmin(id)));
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Update order status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String notes) {
        OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success("Order status updated",
                orderService.updateOrderStatus(id, newStatus, notes, currentUser.getUser())));
    }

    // ===================== Coupons =====================

    @GetMapping("/coupons")
    @Operation(summary = "Get all coupons")
    public ResponseEntity<ApiResponse<PagedResponse<CouponResponse>>> getAllCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getAllCoupons(page, size)));
    }

    @GetMapping("/coupons/{id}")
    @Operation(summary = "Get coupon by ID")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCouponById(id)));
    }

    @PostMapping("/coupons")
    @Operation(summary = "Create a new coupon")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Coupon created", couponService.createCoupon(request)));
    }

    @PutMapping("/coupons/{id}")
    @Operation(summary = "Update a coupon")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", couponService.updateCoupon(id, request)));
    }

    @DeleteMapping("/coupons/{id}")
    @Operation(summary = "Delete a coupon")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted"));
    }

    // ===================== Reviews =====================

    @GetMapping("/reviews/pending")
    @Operation(summary = "Get pending reviews awaiting approval")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getPendingReviews(page, size)));
    }

    @PutMapping("/reviews/{id}/approve")
    @Operation(summary = "Approve a review")
    public ResponseEntity<ApiResponse<ReviewResponse>> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Review approved", reviewService.approveReview(id)));
    }

    @DeleteMapping("/reviews/{id}")
    @Operation(summary = "Reject/delete a review")
    public ResponseEntity<ApiResponse<Void>> rejectReview(@PathVariable Long id) {
        reviewService.rejectReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review rejected"));
    }

    // ===================== Users =====================

    @GetMapping("/users")
    @Operation(summary = "Get all users with optional search")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        var usersPage = userService.getAllUsers(page, size, search);
        PagedResponse<UserResponse> response = PagedResponse.<UserResponse>builder()
                .content(usersPage.getContent())
                .pageNumber(usersPage.getNumber())
                .pageSize(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .last(usersPage.isLast())
                .first(usersPage.isFirst())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Enable/disable a user")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User status updated", userService.toggleUserStatus(id)));
    }
}
