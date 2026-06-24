package com.truzcart.repository;

import com.truzcart.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END " +
           "FROM OrderItem oi WHERE oi.order.user.id = :userId AND oi.product.id = :productId " +
           "AND oi.order.status NOT IN ('CANCELLED', 'REFUNDED')")
    boolean existsByOrderUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("SELECT oi.productName, SUM(oi.quantity) as totalQty, SUM(oi.totalPrice) as totalRev " +
           "FROM OrderItem oi WHERE oi.order.createdAt BETWEEN :start AND :end " +
           "GROUP BY oi.productName ORDER BY totalQty DESC")
    List<Object[]> getProductPerformance(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
