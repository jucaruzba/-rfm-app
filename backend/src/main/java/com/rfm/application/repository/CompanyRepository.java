package com.rfm.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rfm.application.model.entity.Company;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long>{

}
