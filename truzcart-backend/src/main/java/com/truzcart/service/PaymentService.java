package com.truzcart.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.truzcart.constant.AppConstants;
import com.truzcart.dto.payment.PaymentCreateRequest;
import com.truzcart.dto.payment.PaymentCreateResponse;
import com.truzcart.dto.payment.PaymentVerifyRequest;
import com.truzcart.entity.Payment;
import com.truzcart.entity.User;
import com.truzcart.entity.enums.OrderStatus;
import com.truzcart.entity.enums.PaymentStatus;
import com.truzcart.entity.enums.TransactionType;
import com.truzcart.entity.Transaction;
import com.truzcart.exception.PaymentException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.OrderRepository;
import com.truzcart.repository.PaymentRepository;
import com.truzcart.repository.TransactionRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.Formatter;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository,
                          TransactionRepository transactionRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public PaymentCreateResponse createPayment(PaymentCreateRequest request, User user) {
        com.truzcart.entity.Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new PaymentException("Order does not belong to current user");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException("Payment can only be initiated for pending orders");
        }

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(AppConstants.RAZORPAY_AMOUNT_MULTIPLIER)).intValue());
            orderRequest.put("currency", AppConstants.CURRENCY_INR);
            orderRequest.put("receipt", order.getOrderNumber());

            Order razorpayOrder = client.orders.create(orderRequest);

            // Save payment record
            Payment payment = Payment.builder()
                    .order(order)
                    .razorpayOrderId(razorpayOrder.get("id"))
                    .amount(order.getTotalAmount())
                    .currency(AppConstants.CURRENCY_INR)
                    .status(PaymentStatus.CREATED)
                    .build();
            paymentRepository.save(payment);

            log.info("Razorpay order created: {} for order: {}", razorpayOrder.get("id"), order.getOrderNumber());

            return PaymentCreateResponse.builder()
                    .razorpayOrderId(razorpayOrder.get("id"))
                    .amount(order.getTotalAmount())
                    .currency(AppConstants.CURRENCY_INR)
                    .razorpayKeyId(razorpayKeyId)
                    .orderNumber(order.getOrderNumber())
                    .customerName(user.getFullName())
                    .customerEmail(user.getEmail())
                    .customerPhone(user.getPhone())
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed", e);
            throw new PaymentException("Failed to create payment order: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean verifyPayment(PaymentVerifyRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "razorpayOrderId", request.getRazorpayOrderId()));

        // Verify signature
        String generatedSignature = generateSignature(
                request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                razorpayKeySecret);

        if (!generatedSignature.equals(request.getRazorpaySignature())) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            paymentRepository.save(payment);
            log.error("Payment signature verification failed for order: {}", payment.getRazorpayOrderId());
            return false;
        }

        // Payment verified
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setMethod("razorpay");
        paymentRepository.save(payment);

        // Update order status
        com.truzcart.entity.Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Record transaction
        Transaction transaction = Transaction.builder()
                .payment(payment)
                .type(TransactionType.PAYMENT)
                .amount(payment.getAmount())
                .status("SUCCESS")
                .referenceId(request.getRazorpayPaymentId())
                .build();
        transactionRepository.save(transaction);

        log.info("Payment verified and captured: {} for order: {}", request.getRazorpayPaymentId(), order.getOrderNumber());
        return true;
    }

    private String generateSignature(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes());
            try (Formatter formatter = new Formatter()) {
                for (byte b : hash) {
                    formatter.format("%02x", b);
                }
                return formatter.toString();
            }
        } catch (Exception e) {
            throw new PaymentException("Failed to generate payment signature", e);
        }
    }
}
