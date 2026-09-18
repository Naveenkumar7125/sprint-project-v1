package com.eshoppingzone.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "search_activities", indexes = {
        @Index(name = "idx_search_prod", columnList = "product_id"),
        @Index(name = "idx_search_time", columnList = "searched_at"),
        @Index(name = "idx_search_user", columnList = "user_id"),
        @Index(name = "idx_search_keyword", columnList = "keyword")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false)
    private String keyword;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(name = "user_id")
    private Long userId;

    @CreationTimestamp
    @Column(name = "searched_at", updatable = false)
    private Instant searchedAt;
}
