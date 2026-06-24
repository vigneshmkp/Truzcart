package com.truzcart.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private Long id;
    private List<CartItemDto> items;
    private int totalItems;
    private BigDecimal totalPrice;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productSlug;
        private String productImage;
        private BigDecimal productPrice;
        private Integer quantity;
        private BigDecimal subtotal;
        private Boolean inStock;
        private Integer availableStock;
    }
}
