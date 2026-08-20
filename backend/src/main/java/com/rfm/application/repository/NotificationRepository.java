package com.rfm.application.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rfm.application.model.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByIdUserOrderByCreatedAtDesc(Long idUser);
    Page<Notification> findByIdUserOrderByCreatedAtDesc(Long idUser, Pageable pageable);
    List<Notification> findByIdUserAndIsReadFalseOrderByCreatedAtDesc(Long idUser);
    boolean existsByIdUserAndReferenceTypeAndReferenceId(Long idUser, String referenceType, Long referenceId);

    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE n.idUser = :idUser AND n.referenceId = :referenceId AND n.title LIKE CAST(:labelPattern AS string)")
    boolean existsReminderAlert(
            @Param("idUser") Long idUser,
            @Param("referenceId") Long referenceId,
            @Param("labelPattern") String labelPattern);
}
