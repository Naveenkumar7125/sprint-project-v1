package com.eshoppingzone.review.client;

import com.eshoppingzone.review.dto.OrderDto;
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
