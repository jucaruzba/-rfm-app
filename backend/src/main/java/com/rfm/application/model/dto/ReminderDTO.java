package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record ReminderDTO(
    Long idReminder,
    String title,
    String description,
    LocalDateTime reminderDate,
    Long idUser,
    String username,
    Long idObject,
    String objectTitle,
    Boolean isCompleted,
    LocalDateTime completedAt,
    LocalDateTime createdAt
) {}
