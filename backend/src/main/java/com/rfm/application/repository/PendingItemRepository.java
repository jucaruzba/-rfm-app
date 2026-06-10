package com.rfm.application.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rfm.application.model.entity.PendingItem;

import java.util.List;

public interface PendingItemRepository extends JpaRepository<PendingItem, Long> {

    @Query("SELECT p FROM PendingItem p WHERE " +
           "(CAST(:status AS string) IS NULL OR p.status = :status) AND " +
           "(CAST(:createdBy AS long) IS NULL OR p.createdBy = :createdBy) AND " +
           "(CAST(:assignedTo AS long) IS NULL OR p.assignedTo = :assignedTo) AND " +
           "(CAST(:referenceType AS string) IS NULL OR p.referenceType = :referenceType)")
    Page<PendingItem> findWithFilters(
            @Param("status") String status,
            @Param("createdBy") Long createdBy,
            @Param("assignedTo") Long assignedTo,
            @Param("referenceType") String referenceType,
            Pageable pageable);

    @Query("SELECT p FROM PendingItem p WHERE " +
           "(CAST(:status AS string) IS NULL OR p.status = :status) AND " +
           "(CAST(:createdBy AS long) IS NULL OR p.createdBy = :createdBy) AND " +
           "(CAST(:assignedTo AS long) IS NULL OR p.assignedTo = :assignedTo) AND " +
           "(CAST(:referenceType AS string) IS NULL OR p.referenceType = :referenceType)")
    List<PendingItem> findFilters(
            @Param("status") String status,
            @Param("createdBy") Long createdBy,
            @Param("assignedTo") Long assignedTo,
            @Param("referenceType") String referenceType);
    
    
    
    List<PendingItem> findByReferenceId(Long referenceId);
    
}
