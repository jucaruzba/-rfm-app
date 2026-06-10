package com.rfm.application.model.dto;

public record TaskCommentRequest (
	    String content,
	    Long idTask,
	    Long idUser
	) {}