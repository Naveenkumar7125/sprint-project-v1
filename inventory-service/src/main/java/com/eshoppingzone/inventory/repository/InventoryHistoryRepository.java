package com.eshoppingzone.inventory.repository;

import com.eshoppingzone.inventory.entity.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {

    List<InventoryHistory> findByProductId(Long productId);

    List<InventoryHistory> findByOrderId(Long orderId);
}
