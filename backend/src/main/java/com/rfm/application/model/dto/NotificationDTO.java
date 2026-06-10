package com.rfm.application.model.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
    Long idNotification,
    String title,
    String description,
    Long idUser,
    String referenceType,
    Long referenceId,
    Boolean isRead,
    LocalDateTime createdAt
) {}
