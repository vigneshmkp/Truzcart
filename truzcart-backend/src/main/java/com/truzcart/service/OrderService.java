package com.truzcart.service;

import com.truzcart.dto.order.OrderRequest;
import com.truzcart.dto.order.OrderResponse;
import com.truzcart.dto.PagedResponse;
import com.truzcart.entity.*;
import com.truzcart.entity.enums.OrderStatus;
import com.truzcart.exception.BadRequestException;
import com.truzcart.exception.InsufficientStockException;
import com.truzcart.exception.ResourceNotFoundException;
import com.truzcart.repository.*;
import com.truzcart.util.OrderNumberGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CartService cartService;

    public OrderService(OrderRepository orderRepository, OrderStatusHistoryRepository statusHistoryRepository,
                        CartRepository cartRepository, AddressRepository addressRepository,
                        ProductRepository productRepository, CouponRepository couponRepository,
                        CouponUsageRepository couponUsageRepository, CartService cartService) {
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.cartService = cartService;
    }

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BadRequestException("Your cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        Address shippingAddress = addressRepository.findByIdAndUserId(request.getShippingAddressId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getShippingAddressId()));

        // Validate stock
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (cartItem.getQuantity() > product.getStockQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for " + product.getName() + ". Available: " + product.getStockQuantity());
            }
        }

        // Calculate totals
        BigDecimal subtotal = cart.getTotalPrice();
        BigDecimal discountAmount = BigDecimal.ZERO;
        Coupon coupon = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCode(request.getCouponCode().toUpperCase())
                    .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
            if (!coupon.isValid()) {
                throw new BadRequestException("This coupon has expired or reached its usage limit");
            }
            if (couponUsageRepository.existsByCouponIdAndUserId(coupon.getId(), userId)) {
                throw new BadRequestException("You have already used this coupon");
            }
            discountAmount = coupon.calculateDiscount(subtotal);
        }

        BigDecimal shippingAmount = subtotal.compareTo(BigDecimal.valueOf(500)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(49);
        BigDecimal taxAmount = subtotal.multiply(BigDecimal.valueOf(0.18)).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(taxAmount).add(shippingAmount);

        // Create order
        Order order = Order.builder()
                .orderNumber(OrderNumberGenerator.generate("TRZ"))
                .user(User.builder().id(userId).build())
                .shippingAddress(shippingAddress)
                .billingAddress(shippingAddress)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .shippingAmount(shippingAmount)
                .totalAmount(totalAmount)
                .coupon(coupon)
                .status(OrderStatus.PENDING)
                .notes(request.getNotes())
                .build();

        order = orderRepository.save(order);

        // Create order items and reduce stock
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            String primaryImage = product.getImages().stream()
                    .filter(ProductImage::getIsPrimary).findFirst()
                    .map(ProductImage::getImageUrl).orElse(null);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .productImage(primaryImage)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .totalPrice(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();
            order.getItems().add(orderItem);

            // Reduce stock
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // Add status history
        OrderStatusHistory statusHistory = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.PENDING)
                .notes("Order placed")
                .build();
        order.getStatusHistory().add(statusHistory);

        order = orderRepository.save(order);

        // Record coupon usage
        if (coupon != null) {
            CouponUsage usage = CouponUsage.builder()
                    .coupon(coupon).user(User.builder().id(userId).build()).order(order).build();
            couponUsageRepository.save(usage);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        // Clear cart
        cartService.clearCart(userId);

        log.info("Order created: {} for user ID: {}", order.getOrderNumber(), userId);
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getUserOrders(Long userId, int page, int size) {
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return buildPagedResponse(orders);
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getAllOrders(int page, int size, String status) {
        Page<Order> orders;
        if (status != null && !status.isBlank()) {
            orders = orderRepository.findByStatus(OrderStatus.valueOf(status.toUpperCase()),
                    PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            orders = orderRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }
        return buildPagedResponse(orders);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order cannot be cancelled in its current status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        // Restore stock
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order).status(OrderStatus.CANCELLED).notes("Cancelled by customer").build();
        order.getStatusHistory().add(history);

        order = orderRepository.save(order);
        log.info("Order cancelled: {}", order.getOrderNumber());
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus, String notes, User admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        order.setStatus(newStatus);
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order).status(newStatus).notes(notes).createdBy(admin).build();
        order.getStatusHistory().add(history);

        order = orderRepository.save(order);
        log.info("Order {} status updated to {} by admin {}", order.getOrderNumber(), newStatus, admin.getEmail());
        return mapToResponse(order);
    }

    private OrderResponse mapToResponse(Order order) {
        var items = order.getItems().stream().map(item ->
                OrderResponse.OrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productSku(item.getProductSku())
                        .productImage(item.getProductImage())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build()
        ).collect(Collectors.toList());

        OrderResponse.AddressDto addressDto = null;
        if (order.getShippingAddress() != null) {
            Address addr = order.getShippingAddress();
            addressDto = OrderResponse.AddressDto.builder()
                    .id(addr.getId()).fullName(addr.getFullName()).phone(addr.getPhone())
                    .street(addr.getStreet()).city(addr.getCity()).state(addr.getState())
                    .zipCode(addr.getZipCode()).country(addr.getCountry()).build();
        }

        var statusHistory = order.getStatusHistory().stream().map(h ->
                OrderResponse.StatusHistoryDto.builder()
                        .status(h.getStatus()).notes(h.getNotes()).createdAt(h.getCreatedAt()).build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .shippingAmount(order.getShippingAmount())
                .totalAmount(order.getTotalAmount())
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .notes(order.getNotes())
                .shippingAddress(addressDto)
                .items(items)
                .statusHistory(statusHistory)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private PagedResponse<OrderResponse> buildPagedResponse(Page<Order> page) {
        return PagedResponse.<OrderResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .pageNumber(page.getNumber()).pageSize(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).first(page.isFirst()).build();
    }
}
