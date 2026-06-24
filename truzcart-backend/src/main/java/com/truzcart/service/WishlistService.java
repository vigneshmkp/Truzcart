package com.truzcart.service;

import com.truzcart.dto.PagedResponse;
import com.truzcart.dto.wishlist.WishlistResponse;
import com.truzcart.entity.Product;
import com.truzcart.entity.ProductImage;
import com.truzcart.entity.User;
import com.truzcart.entity.Wishlist;
import com.truzcart.exception.BadRequestException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.ProductRepository;
import com.truzcart.repository.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;

    public WishlistService(WishlistRepository wishlistRepository, ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<WishlistResponse> getWishlist(Long userId, int page, int size) {
        Page<Wishlist> wishlistPage = wishlistRepository.findByUserId(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        var items = wishlistPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<WishlistResponse>builder()
                .content(items)
                .pageNumber(wishlistPage.getNumber())
                .pageSize(wishlistPage.getSize())
                .totalElements(wishlistPage.getTotalElements())
                .totalPages(wishlistPage.getTotalPages())
                .last(wishlistPage.isLast())
                .first(wishlistPage.isFirst())
                .build();
    }

    @Transactional
    public WishlistResponse addToWishlist(Long userId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new BadRequestException("Product is already in your wishlist");
        }

        Wishlist wishlist = Wishlist.builder()
                .user(User.builder().id(userId).build())
                .product(product)
                .build();

        return mapToResponse(wishlistRepository.save(wishlist));
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("Wishlist item not found for this product");
        }
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    private WishlistResponse mapToResponse(Wishlist wishlist) {
        Product p = wishlist.getProduct();
        String primaryImage = p.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .productId(p.getId())
                .productName(p.getName())
                .productSlug(p.getSlug())
                .productImage(primaryImage)
                .productPrice(p.getPrice())
                .compareAtPrice(p.getCompareAtPrice())
                .inStock(p.isInStock())
                .isActive(p.getIsActive())
                .addedAt(wishlist.getCreatedAt())
                .build();
    }
}
