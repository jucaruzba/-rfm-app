package com.rfm.application.model.dto;

public record LeadCommentRequest(
    String content,
    Long idLead,
    Long idUser
) {}
