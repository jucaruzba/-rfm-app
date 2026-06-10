package com.rfm.application.model.dto;

public record ProjectRequest(
    String title,
    String description,
    Long createdBy
) {}
