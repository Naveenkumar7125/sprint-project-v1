package com.eshoppingzone.profile.service;

import com.eshoppingzone.common.dto.profile.AddressDto;
import com.eshoppingzone.common.dto.profile.UpdateProfileRequest;
import com.eshoppingzone.common.dto.profile.UserProfileDto;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.profile.entity.Address;
import com.eshoppingzone.profile.entity.UserProfile;
import com.eshoppingzone.profile.repository.AddressRepository;
import com.eshoppingzone.profile.repository.UserProfileRepository;
import com.eshoppingzone.profile.service.impl.ProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private AddressRepository addressRepository;

    private ProfileServiceImpl profileService;

    @BeforeEach
    void setUp() {
        profileService = new ProfileServiceImpl(userProfileRepository, addressRepository);
    }

    @Test
    @DisplayName("Get profile successfully")
    void getProfile_Success() {
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(100L)
                .username("testuser")
                .email("test@example.com")
                .fullName("Test User")
                .addresses(new ArrayList<>())
                .build();

        when(userProfileRepository.findByUserIdWithAddresses(100L)).thenReturn(Optional.of(profile));

        UserProfileDto result = profileService.getProfile(100L);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("Test User", result.getFullName());
    }

    @Test
    @DisplayName("Update profile details successfully")
    void updateProfile_Success() {
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(100L)
                .username("testuser")
                .email("test@example.com")
                .fullName("Old Name")
                .addresses(new ArrayList<>())
                .build();

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("New Name")
                .phoneNumber("9876543210")
                .gender("MALE")
                .build();

        when(userProfileRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);

        UserProfileDto result = profileService.updateProfile(100L, request);

        assertNotNull(result);
        assertEquals("New Name", profile.getFullName());
        assertEquals("9876543210", profile.getPhoneNumber());
    }

    @Test
    @DisplayName("First address automatically becomes default")
    void addAddress_FirstAddress_AutoDefault() {
        UserProfile profile = UserProfile.builder()
                .id(1L)
                .userId(100L)
                .username("testuser")
                .email("test@example.com")
                .build();

        AddressDto addressDto = AddressDto.builder()
                .streetAddress("123 Main St")
                .city("Springfield")
                .state("IL")
                .country("USA")
                .postalCode("62701")
                .isDefault(false) // Client submitted false, but it is the first address
                .build();

        when(userProfileRepository.findByUserId(100L)).thenReturn(Optional.of(profile));
        when(addressRepository.countByProfileId(1L)).thenReturn(0L);

        Address savedAddress = Address.builder()
                .id(10L)
                .userProfile(profile)
                .streetAddress("123 Main St")
                .city("Springfield")
                .state("IL")
                .country("USA")
                .postalCode("62701")
                .isDefault(true) // Should be automatically set to true
                .build();

        when(addressRepository.save(any(Address.class))).thenReturn(savedAddress);

        AddressDto result = profileService.addAddress(100L, addressDto);

        assertNotNull(result);
        assertTrue(result.getIsDefault());
    }

    @Test
    @DisplayName("Set default address resets other addresses")
    void setDefaultAddress_Success() {
        UserProfile profile = UserProfile.builder().id(1L).userId(100L).build();

        Address address = Address.builder()
                .id(20L)
                .userProfile(profile)
                .streetAddress("456 Elm St")
                .city("Chicago")
                .state("IL")
                .country("USA")
                .postalCode("60601")
                .isDefault(false)
                .build();

        when(addressRepository.findByIdAndUserId(20L, 100L)).thenReturn(Optional.of(address));
        when(addressRepository.save(any(Address.class))).thenReturn(address);

        AddressDto result = profileService.setDefaultAddress(100L, 20L);

        assertNotNull(result);
        assertTrue(address.isDefault());
        verify(addressRepository, times(1)).resetDefaultAddressForProfile(1L);
    }
}
