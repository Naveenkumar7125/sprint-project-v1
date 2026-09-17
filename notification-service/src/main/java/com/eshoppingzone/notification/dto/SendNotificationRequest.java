package com.eshoppingzone.notification.dto;

import com.eshoppingzone.common.enums.NotificationChannel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid recipient email format")
    private String recipientEmail;

    private Long recipientUserId;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Content is required")
    private String content;

    private NotificationChannel channel;
}
