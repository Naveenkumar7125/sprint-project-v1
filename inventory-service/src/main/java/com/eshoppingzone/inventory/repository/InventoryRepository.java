package com.eshoppingzone.inventory.repository;

import com.eshoppingzone.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    @Modifying
    @Query("UPDATE Inventory i SET i.availableStock = i.availableStock - :qty, i.reservedStock = i.reservedStock + :qty " +
           "WHERE i.productId = :productId AND i.availableStock >= :qty")
    int atomicReserveStock(@Param("productId") Long productId, @Param("qty") Integer qty);

    @Modifying
    @Query("UPDATE Inventory i SET i.availableStock = i.availableStock + :qty, i.reservedStock = i.reservedStock - :qty " +
           "WHERE i.productId = :productId AND i.reservedStock >= :qty")
    int atomicReleaseStock(@Param("productId") Long productId, @Param("qty") Integer qty);

    @Modifying
    @Query("UPDATE Inventory i SET i.reservedStock = i.reservedStock - :qty, i.soldStock = i.soldStock + :qty " +
           "WHERE i.productId = :productId AND i.reservedStock >= :qty")
    int atomicConfirmStock(@Param("productId") Long productId, @Param("qty") Integer qty);
}
