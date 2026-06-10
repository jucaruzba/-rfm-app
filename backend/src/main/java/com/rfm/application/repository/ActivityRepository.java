package com.rfm.application.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rfm.application.model.entity.Activity;

public interface ActivityRepository extends JpaRepository<Activity, Long>{
	
	@Query("SELECT a FROM Activity a WHERE " +
	           "(:idCompany IS NULL OR a.idCompany = :idCompany) AND " +
	           "(CAST(:startDate AS timestamp) IS NULL OR a.eventDate >= :startDate) AND " +
	           "(CAST(:endDate AS timestamp) IS NULL OR a.eventDate <= :endDate) " +
	           "ORDER BY a.eventDate DESC")
	    List<Activity> findAllByFilters(
	            @Param("idCompany") Long idCompany, 
	            @Param("startDate") LocalDateTime startDate, 
	            @Param("endDate") LocalDateTime endDate
	    );
	
}
