package com.eshoppingzone.notification.service.impl;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.enums.NotificationStatus;
import com.eshoppingzone.notification.dto.NotificationDto;
import com.eshoppingzone.notification.dto.SendNotificationRequest;
import com.eshoppingzone.notification.entity.Notification;
import com.eshoppingzone.notification.repository.NotificationRepository;
import com.eshoppingzone.notification.service.EmailService;
import com.eshoppingzone.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public NotificationDto sendNotification(SendNotificationRequest request) {
        NotificationChannel channel = request.getChannel() != null ? request.getChannel() : NotificationChannel.EMAIL;

        Notification notification = Notification.builder()
                .recipientEmail(request.getRecipientEmail())
                .recipientUserId(request.getRecipientUserId())
                .subject(request.getSubject())
                .content(request.getContent())
                .channel(channel)
                .status(NotificationStatus.PENDING)
                .templateName("CUSTOM_ADMIN")
                .build();

        Notification saved = notificationRepository.save(notification);

        try {
            if (channel == NotificationChannel.EMAIL) {
                emailService.sendEmail(saved.getRecipientEmail(), saved.getSubject(), saved.getContent());
            }
            saved.setStatus(NotificationStatus.SENT);
            saved.setSentAt(Instant.now());
        } catch (Exception e) {
            log.error("Failed to deliver notification ID {}: {}", saved.getId(), e.getMessage());
            saved.setStatus(NotificationStatus.FAILED);
            saved.setErrorMessage(e.getMessage());
        }

        return mapToDto(notificationRepository.save(saved));
    }

    @Override
    @Transactional
    public void createAndSend(String email, Long userId, String subject, String content, NotificationChannel channel, String templateName) {
        if (channel == null) {
            channel = NotificationChannel.EMAIL;
        }

        Notification notification = Notification.builder()
                .recipientEmail(email)
                .recipientUserId(userId)
                .subject(subject)
                .content(content)
                .channel(channel)
                .status(NotificationStatus.PENDING)
                .templateName(templateName)
                .build();

        Notification saved = notificationRepository.save(notification);

        try {
            if (channel == NotificationChannel.EMAIL) {
                emailService.sendEmail(saved.getRecipientEmail(), saved.getSubject(), saved.getContent());
            }
            saved.setStatus(NotificationStatus.SENT);
            saved.setSentAt(Instant.now());
        } catch (Exception e) {
            log.error("Failed to deliver event notification ID {}: {}", saved.getId(), e.getMessage());
            saved.setStatus(NotificationStatus.FAILED);
            saved.setErrorMessage(e.getMessage());
        }

        notificationRepository.save(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientUserId(userId, pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getAllNotifications(NotificationStatus status, Pageable pageable) {
        if (status != null) {
            return notificationRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return notificationRepository.findAll(pageable).map(this::mapToDto);
    }

    private NotificationDto mapToDto(Notification entity) {
        return NotificationDto.builder()
                .id(entity.getId())
                .recipientEmail(entity.getRecipientEmail())
                .recipientUserId(entity.getRecipientUserId())
                .subject(entity.getSubject())
                .content(entity.getContent())
                .channel(entity.getChannel())
                .status(entity.getStatus())
                .templateName(entity.getTemplateName())
                .errorMessage(entity.getErrorMessage())
                .sentAt(entity.getSentAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
