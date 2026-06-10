package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record ProjectObjectDTO(
    Long idObject,
    String title,
    String description,
    Long idProject,
    Long idParent,
    String parentTitle,
    Long idNode,
    Long createdBy,
    String createdByUsername,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
