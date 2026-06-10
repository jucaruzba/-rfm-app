package com.rfm.application.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rfm.application.model.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
    
	@Query("SELECT t FROM Task t WHERE " +
		       "(CAST(:idCompany AS long) IS NULL OR t.idCompany = :idCompany) AND " +
		       "(CAST(:status AS string) IS NULL OR t.status = :status) AND " +
		       "(CAST(:idUser AS long) IS NULL OR t.idUserAssigned = :idUser) AND " +
		       "(CAST(:start AS localdate) IS NULL OR t.startDate >= :start) AND " +
		       "(CAST(:end AS localdate) IS NULL OR t.endDate <= :end)")
		Page<Task> findWithFilters(
		        @Param("idCompany") Long idCompany, 
		        @Param("status") String status, 
		        @Param("idUser") Long idUser, 
		        @Param("start") LocalDate start,
		        @Param("end") LocalDate end,
		        Pageable pageable);
	
	@Query(value = "SELECT * FROM tasks WHERE " +
		       "(CAST(:idCompany AS BIGINT) IS NULL OR id_company = CAST(:idCompany AS BIGINT)) AND " +
		       "(CAST(:status AS VARCHAR) IS NULL OR status = CAST(:status AS VARCHAR)) AND " +
		       "(CAST(:idUser AS BIGINT) IS NULL OR id_user_assigned = CAST(:idUser AS BIGINT)) AND " +
		       "(CAST(:start AS DATE) IS NULL OR CAST(:end AS DATE) IS NULL OR " +
		       "   (start_date <= CAST(:end AS DATE) AND end_date >= CAST(:start AS DATE)))", 
		       nativeQuery = true)
		List<Task> findFilters(
		        @Param("idCompany") Long idCompany, 
		        @Param("status") String status, 
		        @Param("idUser") Long idUser, 
		        @Param("start") LocalDate start,
		        @Param("end") LocalDate end);
}