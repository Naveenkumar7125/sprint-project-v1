package com.eshoppingzone.notification.service;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.enums.NotificationStatus;
import com.eshoppingzone.notification.dto.NotificationDto;
import com.eshoppingzone.notification.dto.SendNotificationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    NotificationDto sendNotification(SendNotificationRequest request);
    void createAndSend(String email, Long userId, String subject, String content, NotificationChannel channel, String templateName);
    Page<NotificationDto> getMyNotifications(Long userId, Pageable pageable);
    Page<NotificationDto> getAllNotifications(NotificationStatus status, Pageable pageable);
}
