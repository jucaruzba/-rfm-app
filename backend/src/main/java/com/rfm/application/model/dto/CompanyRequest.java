package com.rfm.application.model.dto;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;

public record CompanyRequest(
    String name, 
    String description, 
    CompanyType type,
    CompanyStatus status,
    String colorCode
) {
    public CompanyRequest(String name, String description, CompanyType type, CompanyStatus status) {
        this(name, description, type, status, null);
    }
}