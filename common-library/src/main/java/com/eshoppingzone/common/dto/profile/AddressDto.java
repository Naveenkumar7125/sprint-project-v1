package com.eshoppingzone.common.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private Long id;
    private Long profileId;

    @NotBlank(message = "Street address is required")
    private String streetAddress;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Country is required")
    private String country;

    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[0-9]{5,10}$", message = "Postal code must be between 5 and 10 digits")
    private String postalCode;

    private Boolean isDefault;
    private String addressType; // HOME, WORK, OTHER
}
