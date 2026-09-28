package com.rfm.application.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rfm.application.enums.LeadSource;
import com.rfm.application.enums.LeadStatus;

public record LeadRequest(
    String name,
    String companyName,
    String phoneOrEmail,
    String phone,
    String email,
    BigDecimal value,
    LeadSource source,
    String sourceOther,
    String notes,
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate nextFollowUp,
    LeadStatus status
) {}
