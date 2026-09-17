package com.eshoppingzone.common.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private Long productId;
    private Long customerId;
    private String customerUsername;
    private Integer rating;
    private String title;
    private String comment;
    private Instant createdAt;
    private Instant updatedAt;
}
