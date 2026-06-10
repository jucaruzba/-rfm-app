package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.NotificationDTO;
import com.rfm.application.model.entity.Notification;
import com.rfm.application.repository.NotificationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationDTO create(Long idUser, String title, String description, String referenceType, Long referenceId) {
        Notification notification = Notification.builder()
                .idUser(idUser)
                .title(title)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = mapToDTO(saved);

        messagingTemplate.convertAndSend("/topic/notifications/" + idUser, dto);

        return dto;
    }

    @Transactional
    public NotificationDTO markAsRead(Long idNotification) {
        Notification notification = notificationRepository.findById(idNotification)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + saved.getIdUser(), mapToDTO(saved));

        return mapToDTO(saved);
    }

    @Transactional
    public void markMultipleAsRead(List<Long> idNotifications) {
        List<Notification> notifications = notificationRepository.findAllById(idNotifications);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    public NotificationDTO findById(Long idNotification) {
        return notificationRepository.findById(idNotification)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public List<NotificationDTO> findByUser(Long idUser) {
        return notificationRepository.findByIdUserOrderByCreatedAtDesc(idUser)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<NotificationDTO> findByUserPaginated(Long idUser, Pageable pageable) {
        return notificationRepository.findByIdUserOrderByCreatedAtDesc(idUser, pageable)
                .map(this::mapToDTO);
    }

    public List<NotificationDTO> findUnreadByUser(Long idUser) {
        return notificationRepository.findByIdUserAndIsReadFalseOrderByCreatedAtDesc(idUser)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long idNotification) {
        notificationRepository.deleteById(idNotification);
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getIdNotification(),
                notification.getTitle(),
                notification.getDescription(),
                notification.getIdUser(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
