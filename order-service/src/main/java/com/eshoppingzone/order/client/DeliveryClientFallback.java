package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.delivery.DeliveryCreateRequest;
import com.eshoppingzone.common.dto.delivery.DeliveryDto;
import org.springframework.stereotype.Component;

@Component
public class DeliveryClientFallback implements DeliveryClient {
    @Override
    public DeliveryDto createDelivery(DeliveryCreateRequest request) {
        return null;
    }
}
