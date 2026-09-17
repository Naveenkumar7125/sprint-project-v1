package com.eshoppingzone.review.client;

import com.eshoppingzone.common.dto.order.OrderDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class OrderClientFallback implements OrderClient {
    @Override
    public Page<OrderDto> getMyOrders(int page, int size) {
        return new PageImpl<>(Collections.emptyList());
    }
}
