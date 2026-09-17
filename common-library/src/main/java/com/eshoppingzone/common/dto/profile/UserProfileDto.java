package com.eshoppingzone.common.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private List<AddressDto> addresses;
}
