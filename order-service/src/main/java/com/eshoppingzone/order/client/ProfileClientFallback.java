package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.profile.AddressDto;
import org.springframework.stereotype.Component;

@Component
public class ProfileClientFallback implements ProfileClient {
    @Override
    public AddressDto getAddressById(Long id) {
        return null;
    }
}
