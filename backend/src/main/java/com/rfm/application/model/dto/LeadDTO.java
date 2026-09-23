package com.rfm.application.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.rfm.application.enums.LeadSource;
import com.rfm.application.enums.LeadStatus;

import lombok.Builder;

@Builder
public record LeadDTO(
    Long idLead,
    String name,
    String companyName,
    Long idCompany,
    String phoneOrEmail,
    BigDecimal value,
    LeadSource source,
    String sourceOther,
    String notes,
    LocalDate nextFollowUp,
    LeadStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<LeadActivityLogDTO> activityLogs
) {}
