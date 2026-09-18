package com.eshoppingzone.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_category_preferences",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_cat", columnNames = {"user_id", "category_name"}),
        indexes = {
                @Index(name = "idx_user_pref", columnList = "user_id"),
                @Index(name = "idx_user_count", columnList = "interaction_count DESC")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCategoryPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "interaction_count", nullable = false)
    @Builder.Default
    private Long interactionCount = 1L;

    @UpdateTimestamp
    @Column(name = "last_interaction_at")
    private Instant lastInteractionAt;
}
