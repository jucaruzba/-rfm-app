package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;
@Builder
public record ActivityCommentDTO(
    Long idComment,
    String content,
    LocalDateTime createdAt,
    Long idActivity,
    Long idUser,
    String username
) {}