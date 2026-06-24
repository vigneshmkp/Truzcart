package com.truzcart.dto.product;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    @Size(max = 300)
    private String name;

    private String description;

    @Size(max = 500)
    private String shortDescription;

    @NotBlank(message = "SKU is required")
    @Size(max = 100)
    private String sku;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be >= 0")
    private BigDecimal price;

    private BigDecimal compareAtPrice;
    private BigDecimal costPrice;

    @Min(value = 0, message = "Stock quantity must be >= 0")
    private Integer stockQuantity = 0;

    private Integer lowStockThreshold = 10;
    private BigDecimal weight;
    private String dimensions;

    private Long categoryId;

    @Size(max = 150)
    private String brand;

    private Boolean isActive = true;
    private Boolean isFeatured = false;
    private List<String> imageUrls;
}
