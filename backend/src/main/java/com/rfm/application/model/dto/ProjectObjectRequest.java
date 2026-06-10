package com.rfm.application.model.dto;

public record ProjectObjectRequest(
    String title,
    String description,
    Long idProject,
    Long idParent,
    Long createdBy
) {}
