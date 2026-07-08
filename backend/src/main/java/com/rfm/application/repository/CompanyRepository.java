package com.rfm.application.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.model.entity.Company;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long>{
	
    // Encontrar todas las empresas EXCEPTO las archivadas
    List<Company> findByStatusNot(CompanyStatus status);
    
    // Encontrar empresas por estado específico
    List<Company> findByStatus(CompanyStatus status);
    
    // Contar empresas por estado
    long countByStatus(CompanyStatus status);
    
    // Opcional: verificar si existe empresa activa con ese nombre
    boolean existsByNameAndStatusNot(String name, CompanyStatus status);

}
