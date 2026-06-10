package com.rfm.application.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rfm.application.model.entity.Reminder;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByIdUser(Long idUser);

    List<Reminder> findByIdUserAndIsCompleted(Long idUser, Boolean isCompleted);

    List<Reminder> findByReminderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Reminder> findByIdObject(Long idObject);

    @Query("SELECT r FROM Reminder r WHERE " +
    	       "(:idUser IS NULL OR r.idUser = :idUser) AND " +
    	       "(:isCompleted IS NULL OR r.isCompleted = :isCompleted) AND " +
    	       "(CAST(:startDate AS timestamp) IS NULL OR r.reminderDate >= :startDate) AND " +
    	       "(CAST(:endDate AS timestamp) IS NULL OR r.reminderDate <= :endDate)")
    	List<Reminder> findWithFilters(@Param("idUser") Long idUser,
    	                               @Param("isCompleted") Boolean isCompleted,
    	                               @Param("startDate") LocalDateTime startDate,
    	                               @Param("endDate") LocalDateTime endDate);
}
