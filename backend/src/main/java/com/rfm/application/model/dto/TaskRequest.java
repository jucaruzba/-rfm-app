package com.rfm.application.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public record TaskRequest(
    String title,
    String description,
    @JsonFormat(pattern = "dd/MM/yyyy")
    LocalDate startDate,
    @JsonFormat(pattern = "dd/MM/yyyy")
    LocalDate endDate,
    Long idCompany,
    String externalReferenceName,
    Long idUserAssigned,
    String status
) {}