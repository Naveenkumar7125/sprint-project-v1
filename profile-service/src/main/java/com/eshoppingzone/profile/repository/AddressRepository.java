package com.eshoppingzone.profile.repository;

import com.eshoppingzone.profile.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserProfileId(Long profileId);

    @Query("SELECT a FROM Address a WHERE a.id = :id AND a.userProfile.userId = :userId")
    Optional<Address> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM Address a WHERE a.userProfile.id = :profileId")
    long countByProfileId(@Param("profileId") Long profileId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.userProfile.id = :profileId")
    void resetDefaultAddressForProfile(@Param("profileId") Long profileId);
}
