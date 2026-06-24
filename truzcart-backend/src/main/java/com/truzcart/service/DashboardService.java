package com.truzcart.service;

import com.truzcart.dto.admin.DashboardResponse;
import com.truzcart.repository.OrderRepository;
import com.truzcart.repository.ProductRepository;
import com.truzcart.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public DashboardService(UserRepository userRepository, OrderRepository orderRepository,
                            ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userRepository.countTotalUsers();
        long totalOrders = orderRepository.countTotalOrders();
        long totalProducts = productRepository.countActiveProducts();
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();

        // Monthly revenue
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime monthEnd = LocalDateTime.now();
        BigDecimal monthlyRevenue = orderRepository.getRevenueBetween(monthStart, monthEnd);
        long monthlyOrders = orderRepository.countOrdersBetween(monthStart, monthEnd);

        // Monthly sales chart data
        int currentYear = LocalDateTime.now().getYear();
        List<Object[]> monthlySalesData = orderRepository.getMonthlySalesReport(currentYear);
        List<DashboardResponse.MonthlySalesDto> monthlySales = monthlySalesData.stream()
                .map(row -> DashboardResponse.MonthlySalesDto.builder()
                        .month(((Number) row[0]).intValue())
                        .monthName(Month.of(((Number) row[0]).intValue()).getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                        .orderCount(((Number) row[1]).longValue())
                        .revenue(row[2] instanceof BigDecimal ? (BigDecimal) row[2] : BigDecimal.valueOf(((Number) row[2]).doubleValue()))
                        .build())
                .collect(Collectors.toList());

        // Low stock products
        var lowStockProducts = productRepository.findLowStockProducts().stream()
                .limit(10)
                .map(p -> DashboardResponse.LowStockProductDto.builder()
                        .id(p.getId()).name(p.getName()).sku(p.getSku())
                        .stockQuantity(p.getStockQuantity()).lowStockThreshold(p.getLowStockThreshold())
                        .build())
                .collect(Collectors.toList());

        // Top selling products
        var topProducts = productRepository.findTopSellingProducts(PageRequest.of(0, 10))
                .getContent().stream()
                .map(p -> DashboardResponse.TopProductDto.builder()
                        .id(p.getId()).name(p.getName())
                        .reviewCount(p.getReviewCount()).averageRating(p.getAverageRating())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalRevenue(totalRevenue)
                .monthlyRevenue(monthlyRevenue)
                .monthlyOrders(monthlyOrders)
                .monthlySales(monthlySales)
                .lowStockProducts(lowStockProducts)
                .topSellingProducts(topProducts)
                .build();
    }
}
