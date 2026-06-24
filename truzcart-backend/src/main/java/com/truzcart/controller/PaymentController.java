package com.truzcart.controller;

import com.truzcart.dto.ApiResponse;
import com.truzcart.dto.payment.PaymentCreateRequest;
import com.truzcart.dto.payment.PaymentCreateResponse;
import com.truzcart.dto.payment.PaymentVerifyRequest;
import com.truzcart.security.CurrentUser;
import com.truzcart.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Payment processing APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUser currentUser;

    public PaymentController(PaymentService paymentService, CurrentUser currentUser) {
        this.paymentService = paymentService;
        this.currentUser = currentUser;
    }

    @PostMapping("/create")
    @Operation(summary = "Create a Razorpay payment order")
    public ResponseEntity<ApiResponse<PaymentCreateResponse>> createPayment(
            @Valid @RequestBody PaymentCreateRequest request) {
        PaymentCreateResponse response = paymentService.createPayment(request, currentUser.getUser());
        return ResponseEntity.ok(ApiResponse.success("Payment order created", response));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify payment after Razorpay checkout")
    public ResponseEntity<ApiResponse<Boolean>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {
        boolean verified = paymentService.verifyPayment(request);
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Payment verification failed"));
        }
    }
}
