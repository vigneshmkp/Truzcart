package com.truzcart.repository;

import com.truzcart.entity.Payment;
import com.truzcart.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    Page<Payment> findByOrderUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Payment> findByOrderIdAndStatus(Long orderId, PaymentStatus status);
}
