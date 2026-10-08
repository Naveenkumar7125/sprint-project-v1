package com.eshoppingzone.profile.service;

import com.eshoppingzone.profile.dto.AddressDto;
import com.eshoppingzone.profile.dto.UpdateProfileRequest;
import com.eshoppingzone.profile.dto.UserProfileDto;

import java.util.List;

public interface ProfileService {

    UserProfileDto getProfile(Long userId);

    UserProfileDto updateProfile(Long userId, UpdateProfileRequest request);

    AddressDto addAddress(Long userId, AddressDto addressDto);

    List<AddressDto> getAddresses(Long userId);

    AddressDto getAddressById(Long userId, Long addressId);

    AddressDto updateAddress(Long userId, Long addressId, AddressDto addressDto);

    void deleteAddress(Long userId, Long addressId);

    AddressDto setDefaultAddress(Long userId, Long addressId);
}
