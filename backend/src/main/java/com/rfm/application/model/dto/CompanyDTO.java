package com.rfm.application.model.dto;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompanyDTO {
    private Long idCompany;
    private String name;
    private String description;
    private String logoPath;
    private String nasRootFolder;
    private CompanyType type;
    private CompanyStatus status;
}