package com.eshoppingzone.shipping.repository;

import com.eshoppingzone.shipping.entity.WebhookEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WebhookEventLogRepository extends JpaRepository<WebhookEventLog, Long> {

    boolean existsByEventId(String eventId);

    Optional<WebhookEventLog> findByEventId(String eventId);
}
