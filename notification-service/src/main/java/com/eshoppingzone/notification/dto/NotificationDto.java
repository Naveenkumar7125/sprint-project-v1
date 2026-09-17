package com.eshoppingzone.notification.dto;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String recipientEmail;
    private Long recipientUserId;
    private String subject;
    private String content;
    private NotificationChannel channel;
    private NotificationStatus status;
    private String templateName;
    private String errorMessage;
    private Instant sentAt;
    private Instant createdAt;
    private Instant updatedAt;
}
