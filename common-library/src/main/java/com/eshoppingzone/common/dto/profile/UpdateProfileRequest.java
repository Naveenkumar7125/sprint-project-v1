package com.eshoppingzone.common.dto.profile;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number must be valid with 10 to 15 digits")
    private String phoneNumber;

    private LocalDate dateOfBirth;
    private String gender;
}
