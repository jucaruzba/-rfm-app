package com.rfm.application.model.dto;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;

public record CompanyRequest(String name, String description,CompanyType type,
	     CompanyStatus status) {}