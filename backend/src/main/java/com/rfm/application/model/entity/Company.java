package com.rfm.application.model.entity;

import org.springframework.security.core.userdetails.UserDetails;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;
import com.rfm.application.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies")
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_company")
    private Long idCompany;

    @Column(name="name", unique = true, nullable = false)
    private String name;
    
    @Column(name="description")
    private String description;
    
    @Column(name="logo_path")
    private String logoPath;
    
    @Column(name="nas_root_folder")
    private String nas_root_folder;
    
    @Enumerated(EnumType.STRING)  
    @Column(length = 20)
    private CompanyType type;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CompanyStatus status;
}
