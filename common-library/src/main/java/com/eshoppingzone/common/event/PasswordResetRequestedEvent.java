package com.eshoppingzone.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PasswordResetRequestedEvent extends BaseEvent {
    private Long userId;
    private String email;
    private String username;
    private String resetToken;
    private Instant expiresAt;
    private String resetUrl;
}
