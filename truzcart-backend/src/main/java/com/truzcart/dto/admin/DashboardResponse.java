package com.truzcart.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private long totalUsers;
    private long totalOrders;
    private long totalProducts;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;
    private long monthlyOrders;
    private List<MonthlySalesDto> monthlySales;
    private List<LowStockProductDto> lowStockProducts;
    private List<TopProductDto> topSellingProducts;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlySalesDto {
        private int month;
        private String monthName;
        private long orderCount;
        private BigDecimal revenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LowStockProductDto {
        private Long id;
        private String name;
        private String sku;
        private int stockQuantity;
        private int lowStockThreshold;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProductDto {
        private Long id;
        private String name;
        private int reviewCount;
        private BigDecimal averageRating;
    }
}
