package com.rfm.application.model.dto;

import java.time.LocalDateTime;

public record PendingItemDTO(
    Long idPending,
    String title,
    String description,
    String status,
    Long createdBy,
    String create,
    Long assignedTo,
    String referenceType,
    Long referenceId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
