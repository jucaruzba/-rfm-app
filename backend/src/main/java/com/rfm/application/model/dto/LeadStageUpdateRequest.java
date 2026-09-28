package com.rfm.application.model.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rfm.application.enums.LeadStatus;

public record LeadStageUpdateRequest(
    LeadStatus newStatus,
    String note,
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate nextFollowUp
) {}

