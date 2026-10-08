package com.eshoppingzone.auth.dto;

import com.eshoppingzone.auth.enums.AccountStatus;
import com.eshoppingzone.auth.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private Boolean enabled;
    private AccountStatus accountStatus;
    private Long assignedCategoryId;
    private String assignedCategoryName;
    private Instant createdAt;
    private Instant updatedAt;
}
