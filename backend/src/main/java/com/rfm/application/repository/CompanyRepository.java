package com.rfm.application.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.model.entity.Company;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long>{

    @Query("SELECT c FROM Company c WHERE c.status <> com.rfm.application.enums.CompanyStatus.ARCHIVED ORDER BY " +
           "CASE c.status " +
           "  WHEN com.rfm.application.enums.CompanyStatus.ACTIVE THEN 1 " +
           "  WHEN com.rfm.application.enums.CompanyStatus.IN_PROGRESS THEN 2 " +
           "  WHEN com.rfm.application.enums.CompanyStatus.ON_HOLD THEN 3 " +
           "  ELSE 4 END, c.idCompany ASC")
    List<Company> findAllActiveOrdered();

    @Query("SELECT c FROM Company c ORDER BY " +
           "CASE c.status " +
           "  WHEN com.rfm.application.enums.CompanyStatus.ACTIVE THEN 1 " +
           "  WHEN com.rfm.application.enums.CompanyStatus.IN_PROGRESS THEN 2 " +
           "  WHEN com.rfm.application.enums.CompanyStatus.ON_HOLD THEN 3 " +
           "  WHEN com.rfm.application.enums.CompanyStatus.ARCHIVED THEN 4 " +
           "  ELSE 5 END, c.idCompany ASC")
    List<Company> findAllOrdered();
	
    // Encontrar todas las empresas EXCEPTO las archivadas
    List<Company> findByStatusNot(CompanyStatus status);
    
    // Encontrar empresas por estado específico
    List<Company> findByStatus(CompanyStatus status);
    
    // Contar empresas por estado
    long countByStatus(CompanyStatus status);
    
    // Opcional: verificar si existe empresa activa con ese nombre
    boolean existsByNameAndStatusNot(String name, CompanyStatus status);

}
