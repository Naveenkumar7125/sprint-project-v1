package com.eshoppingzone.notification.repository;

import com.eshoppingzone.common.enums.NotificationStatus;
import com.eshoppingzone.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientUserId(Long recipientUserId, Pageable pageable);

    Page<Notification> findByRecipientEmail(String recipientEmail, Pageable pageable);

    Page<Notification> findByStatus(NotificationStatus status, Pageable pageable);

    List<Notification> findTop50ByStatusOrderByCreatedAtAsc(NotificationStatus status);
}
