package com.rfm.application.model.dto;

import java.time.LocalDateTime;

import lombok.Builder;

@Builder
public record TaskCommentDTO (    
		Long idComment,
	    String content,
	    LocalDateTime createdAt,
	    Long idTask,
	    Long idUser,
	    String username
	) {}