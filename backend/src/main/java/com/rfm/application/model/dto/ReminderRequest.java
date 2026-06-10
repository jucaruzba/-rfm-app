package com.rfm.application.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record ReminderRequest(
    String title,
    String description,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime reminderDate,
    Long idUser,
    Long idObject
) {}
