package com.eshoppingzone.notification.controller;

import com.eshoppingzone.common.enums.NotificationStatus;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.notification.dto.NotificationDto;
import com.eshoppingzone.notification.dto.SendNotificationRequest;
import com.eshoppingzone.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification Controller", description = "Endpoints for user alerts, event notification tracking, and broadcast logs")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually trigger a notification to a specific email/user (Admin only)")
    public ResponseEntity<NotificationDto> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        NotificationDto notification = notificationService.sendNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }

    @GetMapping("/my-notifications")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get notification history for the authenticated user")
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<NotificationDto> notifications = notificationService.getMyNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all system notification logs with optional status filter (Admin only)")
    public ResponseEntity<Page<NotificationDto>> getAllNotifications(
            @RequestParam(required = false) NotificationStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NotificationDto> notifications = notificationService.getAllNotifications(status, pageable);
        return ResponseEntity.ok(notifications);
    }
}
