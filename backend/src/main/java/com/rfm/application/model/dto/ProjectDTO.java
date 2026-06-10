package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record ProjectDTO(
    Long idProject,
    String title,
    String description,
    Long idNode,
    Long createdBy,
    String createdByUsername,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
