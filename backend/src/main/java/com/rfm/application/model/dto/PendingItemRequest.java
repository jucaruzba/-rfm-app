package com.rfm.application.model.dto;

import java.time.LocalDateTime;

public record PendingItemRequest(
    String title,
    String description,
    String status,
    Long createdBy,
    Long assignedTo,
    String referenceType,
    Long referenceId
) {}
