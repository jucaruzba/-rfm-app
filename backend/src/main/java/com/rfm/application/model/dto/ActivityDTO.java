package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record ActivityDTO(
    Long idActivity,
    String title,
    String description,
    LocalDateTime eventDate,
    Long idCompany,
    String externalReferenceName,
    Long idNode
) {}