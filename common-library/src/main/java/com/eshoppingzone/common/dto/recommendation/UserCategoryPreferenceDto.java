package com.eshoppingzone.common.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCategoryPreferenceDto {
    private Long categoryId;
    private String categoryName;
    private Long interactionCount;
    private Instant lastInteractionAt;
}
