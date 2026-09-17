package com.eshoppingzone.profile.controller;

import com.eshoppingzone.common.dto.profile.AddressDto;
import com.eshoppingzone.common.dto.profile.UpdateProfileRequest;
import com.eshoppingzone.common.dto.profile.UserProfileDto;
import com.eshoppingzone.common.security.SecurityUtils;
import com.eshoppingzone.profile.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Profile & Addresses", description = "Endpoints for managing user profile and delivery addresses")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile and addresses")
    public ResponseEntity<UserProfileDto> getMyProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserProfileDto profile = profileService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile information")
    public ResponseEntity<UserProfileDto> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserProfileDto updated = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/addresses")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Add a new delivery address (First address automatically set as default)")
    public ResponseEntity<AddressDto> addAddress(@Valid @RequestBody AddressDto addressDto) {
        Long userId = SecurityUtils.getCurrentUserId();
        AddressDto created = profileService.addAddress(userId, addressDto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/addresses")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get all delivery addresses for current customer")
    public ResponseEntity<List<AddressDto>> getAddresses() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<AddressDto> addresses = profileService.getAddresses(userId);
        return ResponseEntity.ok(addresses);
    }

    @GetMapping("/addresses/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get a specific address by ID (ownership enforced)")
    public ResponseEntity<AddressDto> getAddressById(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        AddressDto address = profileService.getAddressById(userId, id);
        return ResponseEntity.ok(address);
    }

    @PutMapping("/addresses/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update an existing address (ownership enforced)")
    public ResponseEntity<AddressDto> updateAddress(@PathVariable Long id, @Valid @RequestBody AddressDto addressDto) {
        Long userId = SecurityUtils.getCurrentUserId();
        AddressDto updated = profileService.updateAddress(userId, id, addressDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/addresses/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete an address (ownership enforced)")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        profileService.deleteAddress(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/addresses/{id}/default")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Set an address as the default delivery address")
    public ResponseEntity<AddressDto> setDefaultAddress(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        AddressDto updated = profileService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(updated);
    }
}
