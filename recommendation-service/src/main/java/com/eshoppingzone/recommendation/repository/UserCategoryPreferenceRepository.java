package com.eshoppingzone.recommendation.repository;

import com.eshoppingzone.recommendation.entity.UserCategoryPreference;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCategoryPreferenceRepository extends JpaRepository<UserCategoryPreference, Long> {

    Optional<UserCategoryPreference> findByUserIdAndCategoryName(Long userId, String categoryName);

    List<UserCategoryPreference> findByUserIdOrderByInteractionCountDesc(Long userId, Pageable pageable);
}
