package com.rfm.application.model.dto;

public record ActivityCommentRequest(
	    String content,
	    Long idActivity,
	    Long idUser
	) {}