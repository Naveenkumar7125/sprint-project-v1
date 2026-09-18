package com.eshoppingzone.common.dto.shipping;

import com.eshoppingzone.common.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentEventDto {
    private Long id;
    private ShipmentStatus status;
    private String location;
    private String description;
    private Instant eventTimestamp;
}
