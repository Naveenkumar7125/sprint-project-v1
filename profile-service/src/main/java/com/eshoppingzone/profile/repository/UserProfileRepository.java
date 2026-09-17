package com.eshoppingzone.profile.repository;

import com.eshoppingzone.profile.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserId(Long userId);

    @Query("SELECT p FROM UserProfile p LEFT JOIN FETCH p.addresses WHERE p.userId = :userId")
    Optional<UserProfile> findByUserIdWithAddresses(@Param("userId") Long userId);
}
