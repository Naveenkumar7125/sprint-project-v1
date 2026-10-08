package com.eshoppingzone.order.client;

import com.eshoppingzone.order.dto.DeliveryCreateRequest;
import com.eshoppingzone.order.dto.DeliveryDto;
import org.springframework.stereotype.Component;

@Component
public class DeliveryClientFallback implements DeliveryClient {
    @Override
    public DeliveryDto createDelivery(DeliveryCreateRequest request) {
        return null;
    }

    @Override
    public DeliveryDto getDeliveryByOrderId(Long orderId) {
        return null;
    }
}
