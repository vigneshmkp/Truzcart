package com.truzcart.dto.order;

import com.truzcart.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal totalAmount;
    private String couponCode;
    private String notes;
    private AddressDto shippingAddress;
    private List<OrderItemDto> items;
    private List<StatusHistoryDto> statusHistory;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productSku;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AddressDto {
        private Long id;
        private String fullName;
        private String phone;
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StatusHistoryDto {
        private OrderStatus status;
        private String notes;
        private LocalDateTime createdAt;
    }
}
