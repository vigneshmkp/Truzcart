package com.truzcart.controller;

import com.truzcart.dto.ApiResponse;
import com.truzcart.dto.user.AddressRequest;
import com.truzcart.dto.user.ChangePasswordRequest;
import com.truzcart.dto.user.UpdateProfileRequest;
import com.truzcart.dto.user.UserResponse;
import com.truzcart.security.CurrentUser;
import com.truzcart.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@Tag(name = "User", description = "User profile & address management APIs")
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;

    public UserController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    // ===================== Profile =====================

    @GetMapping("/profile")
    @Operation(summary = "Get current user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(currentUser.getUserId())));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                userService.updateProfile(currentUser.getUserId(), request)));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change current user's password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    // ===================== Addresses =====================

    @GetMapping("/addresses")
    @Operation(summary = "Get current user's addresses")
    public ResponseEntity<ApiResponse<List<UserResponse.AddressResponse>>> getAddresses() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAddresses(currentUser.getUserId())));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Add a new address")
    public ResponseEntity<ApiResponse<UserResponse.AddressResponse>> addAddress(
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added", userService.addAddress(currentUser.getUserId(), request)));
    }

    @PutMapping("/addresses/{id}")
    @Operation(summary = "Update an address")
    public ResponseEntity<ApiResponse<UserResponse.AddressResponse>> updateAddress(
            @PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Address updated",
                userService.updateAddress(currentUser.getUserId(), id, request)));
    }

    @DeleteMapping("/addresses/{id}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable Long id) {
        userService.deleteAddress(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted"));
    }

    @PatchMapping("/addresses/{id}/default")
    @Operation(summary = "Set address as default")
    public ResponseEntity<ApiResponse<UserResponse.AddressResponse>> setDefaultAddress(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Default address updated",
                userService.setDefaultAddress(currentUser.getUserId(), id)));
    }
}
