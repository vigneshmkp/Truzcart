package com.truzcart.service;

import com.truzcart.dto.product.ProductRequest;
import com.truzcart.dto.product.ProductResponse;
import com.truzcart.dto.PagedResponse;
import com.truzcart.entity.*;
import com.truzcart.exception.BadRequestException;
import com.truzcart.exception.DuplicateResourceException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.*;
import com.truzcart.util.SlugUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryLogRepository inventoryLogRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository,
                          ProductImageRepository productImageRepository, InventoryLogRepository inventoryLogRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryLogRepository = inventoryLogRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> products = productRepository.findByIsActiveTrue(pageable);
        return buildPagedResponse(products);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> searchProducts(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> products = productRepository.searchProducts(query, pageable);
        return buildPagedResponse(products);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getProductsByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> products = productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
        return buildPagedResponse(products);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getFeaturedProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> products = productRepository.findByIsFeaturedTrueAndIsActiveTrue(pageable);
        return buildPagedResponse(products);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new DuplicateResourceException("Product with SKU already exists: " + request.getSku());
        }

        Product product = new Product();
        mapRequestToEntity(request, product);
        product.setSlug(SlugUtil.toSlug(request.getName()));

        // Handle duplicate slugs
        String baseSlug = product.getSlug();
        int counter = 1;
        while (productRepository.findBySlug(product.getSlug()).isPresent()) {
            product.setSlug(baseSlug + "-" + counter++);
        }

        product = productRepository.save(product);

        // Save product images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            Product finalProduct = product;
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(finalProduct)
                        .imageUrl(request.getImageUrls().get(i))
                        .displayOrder(i)
                        .isPrimary(i == 0)
                        .build();
                productImageRepository.save(image);
            }
        }

        log.info("Product created: {} (SKU: {})", product.getName(), product.getSku());
        return mapToResponse(productRepository.findById(product.getId()).orElse(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        mapRequestToEntity(request, product);

        if (!product.getName().equals(request.getName())) {
            product.setSlug(SlugUtil.toSlug(request.getName()));
        }

        product = productRepository.save(product);
        log.info("Product updated: {} (ID: {})", product.getName(), product.getId());
        return mapToResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        productRepository.delete(product);
        log.info("Product deleted: {} (ID: {})", product.getName(), id);
    }

    @Transactional
    public ProductResponse updateStock(Long id, int quantityChange, String reason, User user) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        int previousStock = product.getStockQuantity();
        int newStock = previousStock + quantityChange;
        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock. Current: " + previousStock + ", Change: " + quantityChange);
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryLog inventoryLog = InventoryLog.builder()
                .product(product)
                .quantityChange(quantityChange)
                .previousStock(previousStock)
                .newStock(newStock)
                .reason(reason)
                .createdBy(user)
                .build();
        inventoryLogRepository.save(inventoryLog);

        log.info("Stock updated for product {}: {} -> {} (reason: {})", product.getSku(), previousStock, newStock, reason);
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse toggleProductStatus(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setIsActive(!product.getIsActive());
        productRepository.save(product);
        return mapToResponse(product);
    }

    private void mapRequestToEntity(ProductRequest request, Product product) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setSku(request.getSku());
        product.setPrice(request.getPrice());
        product.setCompareAtPrice(request.getCompareAtPrice());
        product.setCostPrice(request.getCostPrice());
        product.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0);
        product.setLowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10);
        product.setWeight(request.getWeight());
        product.setDimensions(request.getDimensions());
        product.setBrand(request.getBrand());
        product.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        product.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        }
    }

    private ProductResponse mapToResponse(Product product) {
        List<ProductResponse.ProductImageDto> imageDtos = product.getImages().stream()
                .map(img -> ProductResponse.ProductImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .altText(img.getAltText())
                        .displayOrder(img.getDisplayOrder())
                        .isPrimary(img.getIsPrimary())
                        .build())
                .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .shortDescription(product.getShortDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .compareAtPrice(product.getCompareAtPrice())
                .costPrice(product.getCostPrice())
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .weight(product.getWeight())
                .dimensions(product.getDimensions())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .brand(product.getBrand())
                .isActive(product.getIsActive())
                .isFeatured(product.getIsFeatured())
                .averageRating(product.getAverageRating())
                .reviewCount(product.getReviewCount())
                .discountPercentage(product.getDiscountPercentage())
                .inStock(product.isInStock())
                .images(imageDtos)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private PagedResponse<ProductResponse> buildPagedResponse(Page<Product> page) {
        List<ProductResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<ProductResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }
}
