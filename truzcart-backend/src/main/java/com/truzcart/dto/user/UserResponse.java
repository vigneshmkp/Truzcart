package com.truzcart.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private Boolean emailVerified;
    private Boolean enabled;
    private Set<String> roles;
    private List<AddressResponse> addresses;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AddressResponse {
        private Long id;
        private String label;
        private String fullName;
        private String phone;
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private Boolean isDefault;
    }
}
