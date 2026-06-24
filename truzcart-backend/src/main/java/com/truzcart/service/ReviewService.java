package com.truzcart.service;

import com.truzcart.dto.PagedResponse;
import com.truzcart.dto.review.ReviewRequest;
import com.truzcart.dto.review.ReviewResponse;
import com.truzcart.entity.Product;
import com.truzcart.entity.Review;
import com.truzcart.entity.User;
import com.truzcart.exception.BadRequestException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.OrderItemRepository;
import com.truzcart.repository.ProductRepository;
import com.truzcart.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository,
                         OrderItemRepository orderItemRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // ===================== Public =====================

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Page<Review> reviewPage = reviewRepository.findByProductIdAndIsApprovedTrue(productId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return buildPagedResponse(reviewPage);
    }

    // ===================== Customer =====================

    @Transactional
    public ReviewResponse addReview(Long userId, ReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (reviewRepository.existsByUserIdAndProductId(userId, request.getProductId())) {
            throw new BadRequestException("You have already reviewed this product");
        }

        // Check if user has purchased this product
        boolean hasPurchased = orderItemRepository.existsByOrderUserIdAndProductId(userId, request.getProductId());

        Review review = Review.builder()
                .user(User.builder().id(userId).build())
                .product(product)
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerifiedPurchase(hasPurchased)
                .isApproved(false) // Requires admin approval
                .build();

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only update your own reviews");
        }

        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setComment(request.getComment());
        review.setIsApproved(false); // Re-approve needed after edit

        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
        recalculateProductRating(review.getProduct().getId());
    }

    // ===================== Admin =====================

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> getPendingReviews(int page, int size) {
        Page<Review> reviewPage = reviewRepository.findByIsApprovedFalse(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return buildPagedResponse(reviewPage);
    }

    @Transactional
    public ReviewResponse approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        review.setIsApproved(true);
        Review saved = reviewRepository.save(review);

        recalculateProductRating(review.getProduct().getId());
        return mapToResponse(saved);
    }

    @Transactional
    public void rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        reviewRepository.delete(review);
        recalculateProductRating(review.getProduct().getId());
    }

    // ===================== Helpers =====================

    private void recalculateProductRating(Long productId) {
        BigDecimal avgRating = reviewRepository.getAverageRatingByProductId(productId);
        int reviewCount = reviewRepository.countApprovedByProductId(productId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        product.setAverageRating(avgRating);
        product.setReviewCount(reviewCount);
        productRepository.save(product);
    }

    private PagedResponse<ReviewResponse> buildPagedResponse(Page<Review> reviewPage) {
        var items = reviewPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<ReviewResponse>builder()
                .content(items)
                .pageNumber(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .first(reviewPage.isFirst())
                .build();
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFirstName() + " " + review.getUser().getLastName())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .isApproved(review.getIsApproved())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
