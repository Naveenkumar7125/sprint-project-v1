package com.eshoppingzone.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEvent implements Serializable {
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private String correlationId;

    public static String generateEventId() {
        return UUID.randomUUID().toString();
    }
}
