package com.eshoppingzone.profile.dto;

import com.eshoppingzone.profile.enums.AccountStatus;
import com.eshoppingzone.profile.enums.UserRole;
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
    private Instant createdAt;
    private Instant updatedAt;
}
