package com.eshoppingzone.common.dto.recommendation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchEventRequest {
    @NotBlank(message = "Search query is required")
    private String query;
    private Long categoryId;
    private String categoryName;
    private List<Long> matchedProductIds;
}
