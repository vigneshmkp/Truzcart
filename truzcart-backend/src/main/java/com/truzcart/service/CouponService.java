package com.truzcart.service;

import com.truzcart.dto.PagedResponse;
import com.truzcart.dto.coupon.CouponRequest;
import com.truzcart.dto.coupon.CouponResponse;
import com.truzcart.dto.coupon.CouponValidationResponse;
import com.truzcart.entity.Coupon;
import com.truzcart.exception.BadRequestException;
import com.truzcart.exception.DuplicateResourceException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.CouponRepository;
import com.truzcart.repository.CouponUsageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public CouponService(CouponRepository couponRepository, CouponUsageRepository couponUsageRepository) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    // ===================== Customer =====================

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, BigDecimal orderTotal) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase().trim()).orElse(null);

        if (coupon == null) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Invalid coupon code")
                    .code(code)
                    .build();
        }

        if (!coupon.isValid()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("This coupon has expired or is no longer available")
                    .code(code)
                    .build();
        }

        if (orderTotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Minimum order amount of ₹" + coupon.getMinOrderAmount() + " required")
                    .code(code)
                    .minOrderAmount(coupon.getMinOrderAmount())
                    .build();
        }

        BigDecimal discount = coupon.calculateDiscount(orderTotal);

        return CouponValidationResponse.builder()
                .valid(true)
                .message("Coupon applied successfully! You save ₹" + discount)
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .calculatedDiscount(discount)
                .minOrderAmount(coupon.getMinOrderAmount())
                .build();
    }

    // ===================== Admin =====================

    @Transactional(readOnly = true)
    public PagedResponse<CouponResponse> getAllCoupons(int page, int size) {
        Page<Coupon> couponPage = couponRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        var items = couponPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<CouponResponse>builder()
                .content(items)
                .pageNumber(couponPage.getNumber())
                .pageSize(couponPage.getSize())
                .totalElements(couponPage.getTotalElements())
                .totalPages(couponPage.getTotalPages())
                .last(couponPage.isLast())
                .first(couponPage.isFirst())
                .build();
    }

    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        return mapToResponse(coupon);
    }

    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode().toUpperCase().trim())) {
            throw new DuplicateResourceException("Coupon with code '" + request.getCode() + "' already exists");
        }

        if (request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new BadRequestException("Valid until date must be after valid from date");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .active(request.getActive())
                .build();

        return mapToResponse(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));

        // Check for duplicate code (if changed)
        if (!coupon.getCode().equalsIgnoreCase(request.getCode())) {
            if (couponRepository.existsByCode(request.getCode().toUpperCase().trim())) {
                throw new DuplicateResourceException("Coupon with code '" + request.getCode() + "' already exists");
            }
        }

        coupon.setCode(request.getCode().toUpperCase().trim());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidUntil(request.getValidUntil());
        coupon.setActive(request.getActive());

        return mapToResponse(couponRepository.save(coupon));
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        couponRepository.delete(coupon);
    }

    // ===================== Mapping =====================

    private CouponResponse mapToResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscount(coupon.getMaxDiscount())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .active(coupon.getActive())
                .isValid(coupon.isValid())
                .createdAt(coupon.getCreatedAt())
                .build();
    }
}
