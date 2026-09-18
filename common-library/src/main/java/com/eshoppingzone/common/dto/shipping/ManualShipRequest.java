package com.eshoppingzone.common.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualShipRequest {
    private String carrierPreference;
    private String pickupAddress;
    private List<Long> itemIds;
    private String merchantNotes;
}
