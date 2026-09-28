package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record LeadCommentDTO(
    Long idComment,
    String content,
    LocalDateTime createdAt,
    Long idLead,
    Long idUser,
    String username
) {}
