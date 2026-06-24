package com.truzcart.controller;

import com.truzcart.dto.ApiResponse;
import com.truzcart.dto.coupon.CouponValidationResponse;
import com.truzcart.security.CurrentUser;
import com.truzcart.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/coupons")
@Tag(name = "Coupons", description = "Customer coupon validation APIs")
public class CouponController {

    private final CouponService couponService;
    private final CurrentUser currentUser;

    public CouponController(CouponService couponService, CurrentUser currentUser) {
        this.couponService = couponService;
        this.currentUser = currentUser;
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate a coupon code and get discount info")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal orderTotal) {
        return ResponseEntity.ok(ApiResponse.success(couponService.validateCoupon(code, orderTotal)));
    }
}
