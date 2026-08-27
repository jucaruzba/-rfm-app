package com.rfm.application.model.dto;

import java.time.LocalDate;
import com.rfm.application.enums.RepeatType;

import lombok.Builder;

@Builder
public record TaskDTO(
    Long idTask,
    String title,
    String description,
    String status,
    LocalDate startDate,
    LocalDate endDate,
    Long idCompany,
    String nameCompany,
    String externalReferenceName,
    Long idUserAssigned,
    String nameUser,
    Long idNode,
    RepeatType repeatType,
    LocalDate repeatEndDate,
    Long parentTaskId,
    String priority,
    String seriesId
) {}