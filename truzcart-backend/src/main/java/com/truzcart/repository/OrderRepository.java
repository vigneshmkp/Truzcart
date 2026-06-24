package com.truzcart.repository;

import com.truzcart.entity.Order;
import com.truzcart.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o")
    long countTotalOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt BETWEEN :start AND :end AND o.status NOT IN ('CANCELLED', 'REFUNDED')")
    BigDecimal getRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    long countOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', o.createdAt) as orderDate, COUNT(o) as orderCount, COALESCE(SUM(o.totalAmount), 0) as revenue " +
           "FROM Order o WHERE o.createdAt BETWEEN :start AND :end AND o.status NOT IN ('CANCELLED', 'REFUNDED') " +
           "GROUP BY FUNCTION('DATE', o.createdAt) ORDER BY orderDate")
    List<Object[]> getDailySalesReport(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', o.createdAt) as month, COUNT(o) as orderCount, COALESCE(SUM(o.totalAmount), 0) as revenue " +
           "FROM Order o WHERE FUNCTION('YEAR', o.createdAt) = :year AND o.status NOT IN ('CANCELLED', 'REFUNDED') " +
           "GROUP BY FUNCTION('MONTH', o.createdAt) ORDER BY month")
    List<Object[]> getMonthlySalesReport(@Param("year") int year);
}
