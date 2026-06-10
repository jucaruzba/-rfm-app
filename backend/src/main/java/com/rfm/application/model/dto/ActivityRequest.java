package com.rfm.application.model.dto;

import java.time.LocalDateTime;

public record ActivityRequest(
	    String title,
	    String description,
	    LocalDateTime eventDate,
	    Long idCompany,
	    String externalReferenceName
	) {}