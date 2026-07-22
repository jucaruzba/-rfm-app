package com.rfm.application.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rfm.application.enums.RepeatType;
import com.rfm.application.model.entity.Reminder;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    
    // Métodos existentes
    List<Reminder> findByIdUser(Long idUser);

    List<Reminder> findByIdUserAndIsCompleted(Long idUser, Boolean isCompleted);

    List<Reminder> findByReminderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Reminder> findByIdObject(Long idObject);

    // Método de filtro original
    @Query("SELECT r FROM Reminder r WHERE " +
           "(:idUser IS NULL OR r.idUser = :idUser) AND " +
           "(:isCompleted IS NULL OR r.isCompleted = :isCompleted) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR r.reminderDate >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR r.reminderDate <= :endDate)")
    List<Reminder> findWithFilters(@Param("idUser") Long idUser,
                                   @Param("isCompleted") Boolean isCompleted,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);

    // Nuevo método de filtro con RepeatType
    @Query("SELECT r FROM Reminder r WHERE " +
           "(:idUser IS NULL OR r.idUser = :idUser) AND " +
           "(:isCompleted IS NULL OR r.isCompleted = :isCompleted) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR r.reminderDate >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR r.reminderDate <= :endDate) AND " +
           "(:repeatType IS NULL OR r.repeatType = :repeatType)")
    List<Reminder> findWithFilters(@Param("idUser") Long idUser,
                                   @Param("isCompleted") Boolean isCompleted,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   @Param("repeatType") RepeatType repeatType);

    // Métodos para recordatorios con repetición
    @Query("SELECT r FROM Reminder r WHERE r.idUser = :idUser AND r.isCompleted = false " +
           "AND (r.repeatType = 'NONE' OR r.nextReminderDate IS NOT NULL) " +
           "ORDER BY r.reminderDate ASC")
    List<Reminder> findActiveReminders(@Param("idUser") Long idUser);

    // Filtrar por tipo de repetición
    @Query("SELECT r FROM Reminder r WHERE r.idUser = :idUser AND r.repeatType = :repeatType")
    List<Reminder> findByRepeatType(@Param("idUser") Long idUser, 
                                   @Param("repeatType") RepeatType repeatType);

    // Buscar recordatorios en rango de fechas (incluyendo repeticiones)
    @Query("SELECT r FROM Reminder r WHERE r.isCompleted = false AND r.reminderDate BETWEEN :startDate AND :endDate " +
           "UNION ALL " +
           "SELECT r FROM Reminder r WHERE r.isCompleted = false AND r.repeatType != 'NONE' " +
           "AND r.nextReminderDate BETWEEN :startDate AND :endDate")
    List<Reminder> findRemindersInDateRange(@Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);

    // Obtener la cadena completa de recordatorios repetitivos
    @Query("SELECT r FROM Reminder r WHERE r.parentReminderId = :parentId OR r.idReminder = :parentId ORDER BY r.reminderDate ASC")
    List<Reminder> findReminderChain(@Param("parentId") Long parentId);

    // Eliminar toda la cadena de recordatorios repetitivos
    @Modifying
    @Query("DELETE FROM Reminder r WHERE r.parentReminderId = :parentId OR r.idReminder = :parentId")
    void deleteChain(@Param("parentId") Long parentId);

    // Buscar recordatorios que necesitan ser generados (para un job programado)
    @Query("SELECT r FROM Reminder r WHERE r.isCompleted = false " +
           "AND r.repeatType != 'NONE' " +
           "AND r.nextReminderDate IS NOT NULL " +
           "AND r.nextReminderDate <= :currentDate " +
           "AND (r.repeatEndDate IS NULL OR r.nextReminderDate <= r.repeatEndDate)")
    List<Reminder> findRemindersToGenerate(@Param("currentDate") LocalDateTime currentDate);

    // Contar recordatorios activos por usuario
    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.idUser = :idUser AND r.isCompleted = false")
    Long countActiveRemindersByUser(@Param("idUser") Long idUser);

    // Buscar recordatorios por fecha de creación
    List<Reminder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Buscar recordatorios completados en un rango de fechas
    List<Reminder> findByIsCompletedTrueAndCompletedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Buscar recordatorios por usuario y rango de fechas
    @Query("SELECT r FROM Reminder r WHERE r.idUser = :idUser " +
           "AND r.reminderDate BETWEEN :startDate AND :endDate")
    List<Reminder> findByIdUserAndReminderDateBetween(@Param("idUser") Long idUser,
                                                      @Param("startDate") LocalDateTime startDate,
                                                      @Param("endDate") LocalDateTime endDate);

    // Buscar recordatorios por objeto y estado de completado
    List<Reminder> findByIdObjectAndIsCompleted(Long idObject, Boolean isCompleted);

    // Buscar recordatorios con repetición que están por vencer
    @Query("SELECT r FROM Reminder r WHERE r.isCompleted = false " +
           "AND r.repeatType != 'NONE' " +
           "AND r.repeatEndDate IS NOT NULL " +
           "AND r.repeatEndDate BETWEEN :startDate AND :endDate")
    List<Reminder> findRecurringRemindersEndingBetween(@Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);

    // Buscar el siguiente recordatorio en una cadena
    @Query("SELECT r FROM Reminder r WHERE r.parentReminderId = :parentId " +
           "AND r.isCompleted = false " +
           "ORDER BY r.reminderDate ASC")
    List<Reminder> findNextRemindersInChain(@Param("parentId") Long parentId);

    // Buscar recordatorios sin repetición
    @Query("SELECT r FROM Reminder r WHERE r.idUser = :idUser AND r.repeatType = 'NONE'")
    List<Reminder> findOneTimeReminders(@Param("idUser") Long idUser);

    // Buscar recordatorios con repetición activa
    @Query("SELECT r FROM Reminder r WHERE r.idUser = :idUser " +
           "AND r.repeatType != 'NONE' " +
           "AND r.isCompleted = false " +
           "AND (r.repeatEndDate IS NULL OR r.repeatEndDate >= :currentDate)")
    List<Reminder> findActiveRecurringReminders(@Param("idUser") Long idUser,
                                                @Param("currentDate") LocalDateTime currentDate);
    
    // Buscar hijos por parentId
    List<Reminder> findByParentReminderId(Long parentId);
    
    // Buscar hijos ordenados por fecha descendente
    List<Reminder> findByParentReminderIdOrderByReminderDateDesc(Long parentId);
    
    // Verificar si existe un recordatorio con la misma fecha para un padre
    boolean existsByParentReminderIdAndReminderDate(Long parentId, LocalDateTime reminderDate);
}