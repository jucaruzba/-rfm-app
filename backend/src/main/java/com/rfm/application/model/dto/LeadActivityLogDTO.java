package com.rfm.application.model.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.rfm.application.enums.LeadStatus;

import lombok.Builder;

@Builder
public record LeadActivityLogDTO(
    Long idLog,
    Long idLead,
    LeadStatus fromStatus,
    LeadStatus toStatus,
    String note,
    LocalDate nextFollowUp,
    String createdByUser,
    LocalDateTime createdAt
) {}
