package com.eshoppingzone.notification.entity;

import com.eshoppingzone.common.enums.NotificationChannel;
import com.eshoppingzone.common.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user", columnList = "recipient_user_id"),
        @Index(name = "idx_notif_email", columnList = "recipient_email"),
        @Index(name = "idx_notif_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_email", nullable = false, length = 100)
    private String recipientEmail;

    @Column(name = "recipient_user_id")
    private Long recipientUserId;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status;

    @Column(name = "template_name", length = 50)
    private String templateName;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "sent_at")
    private Instant sentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
