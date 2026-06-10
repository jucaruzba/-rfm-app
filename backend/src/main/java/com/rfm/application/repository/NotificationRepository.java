package com.rfm.application.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rfm.application.model.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByIdUserOrderByCreatedAtDesc(Long idUser);
    Page<Notification> findByIdUserOrderByCreatedAtDesc(Long idUser, Pageable pageable);
    List<Notification> findByIdUserAndIsReadFalseOrderByCreatedAtDesc(Long idUser);
}
