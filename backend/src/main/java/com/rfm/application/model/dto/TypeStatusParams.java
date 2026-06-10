package com.rfm.application.model.dto;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TypeStatusParams {

    private CompanyType type;
    private CompanyStatus status;

}
