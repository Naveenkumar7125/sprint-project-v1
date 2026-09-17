package com.eshoppingzone.order.client;

import com.eshoppingzone.common.dto.profile.AddressDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service", fallback = ProfileClientFallback.class)
public interface ProfileClient {

    @GetMapping("/api/v1/profiles/addresses/{id}")
    AddressDto getAddressById(@PathVariable("id") Long id);
}
