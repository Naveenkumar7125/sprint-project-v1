package com.eshoppingzone.profile.service.impl;

import com.eshoppingzone.common.dto.profile.AddressDto;
import com.eshoppingzone.common.dto.profile.UpdateProfileRequest;
import com.eshoppingzone.common.dto.profile.UserProfileDto;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.profile.entity.Address;
import com.eshoppingzone.profile.entity.UserProfile;
import com.eshoppingzone.profile.repository.AddressRepository;
import com.eshoppingzone.profile.repository.UserProfileRepository;
import com.eshoppingzone.profile.service.ProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;

    public ProfileServiceImpl(UserProfileRepository userProfileRepository, AddressRepository addressRepository) {
        this.userProfileRepository = userProfileRepository;
        this.addressRepository = addressRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserIdWithAddresses(userId)
                .orElseGet(() -> userProfileRepository.findByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId)));
        return mapToProfileDto(profile);
    }

    @Override
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId));

        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            profile.setGender(request.getGender());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        log.info("Updated profile for userId: {}", userId);
        return mapToProfileDto(savedProfile);
    }

    @Override
    public AddressDto addAddress(Long userId, AddressDto addressDto) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId));

        long existingAddressesCount = addressRepository.countByProfileId(profile.getId());
        boolean shouldBeDefault = existingAddressesCount == 0 || Boolean.TRUE.equals(addressDto.getIsDefault());

        if (shouldBeDefault && existingAddressesCount > 0) {
            addressRepository.resetDefaultAddressForProfile(profile.getId());
        }

        Address address = Address.builder()
                .userProfile(profile)
                .streetAddress(addressDto.getStreetAddress())
                .city(addressDto.getCity())
                .state(addressDto.getState())
                .country(addressDto.getCountry())
                .postalCode(addressDto.getPostalCode())
                .isDefault(shouldBeDefault)
                .addressType(addressDto.getAddressType() != null ? addressDto.getAddressType() : "HOME")
                .build();

        Address savedAddress = addressRepository.save(address);
        log.info("Added address id: {} for userId: {}, default: {}", savedAddress.getId(), userId, savedAddress.isDefault());
        return mapToAddressDto(savedAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDto> getAddresses(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId));

        return addressRepository.findByUserProfileId(profile.getId())
                .stream()
                .map(this::mapToAddressDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AddressDto getAddressById(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        return mapToAddressDto(address);
    }

    @Override
    public AddressDto updateAddress(Long userId, Long addressId, AddressDto addressDto) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        address.setStreetAddress(addressDto.getStreetAddress());
        address.setCity(addressDto.getCity());
        address.setState(addressDto.getState());
        address.setCountry(addressDto.getCountry());
        address.setPostalCode(addressDto.getPostalCode());
        if (addressDto.getAddressType() != null) {
            address.setAddressType(addressDto.getAddressType());
        }

        if (Boolean.TRUE.equals(addressDto.getIsDefault()) && !address.isDefault()) {
            addressRepository.resetDefaultAddressForProfile(address.getUserProfile().getId());
            address.setDefault(true);
        }

        Address saved = addressRepository.save(address);
        log.info("Updated address id: {} for userId: {}", addressId, userId);
        return mapToAddressDto(saved);
    }

    @Override
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        addressRepository.delete(address);
        log.info("Deleted address id: {} for userId: {}", addressId, userId);
    }

    @Override
    public AddressDto setDefaultAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        addressRepository.resetDefaultAddressForProfile(address.getUserProfile().getId());
        address.setDefault(true);
        Address saved = addressRepository.save(address);

        log.info("Set address id: {} as default for userId: {}", addressId, userId);
        return mapToAddressDto(saved);
    }

    private UserProfileDto mapToProfileDto(UserProfile profile) {
        List<AddressDto> addressDtos = profile.getAddresses() != null
                ? profile.getAddresses().stream().map(this::mapToAddressDto).collect(Collectors.toList())
                : List.of();

        return UserProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .username(profile.getUsername())
                .email(profile.getEmail())
                .fullName(profile.getFullName())
                .phoneNumber(profile.getPhoneNumber())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .addresses(addressDtos)
                .build();
    }

    private AddressDto mapToAddressDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .profileId(address.getUserProfile() != null ? address.getUserProfile().getId() : null)
                .streetAddress(address.getStreetAddress())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .isDefault(address.isDefault())
                .addressType(address.getAddressType())
                .build();
    }
}
