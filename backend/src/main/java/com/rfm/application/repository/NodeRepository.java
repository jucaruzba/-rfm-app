package com.rfm.application.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rfm.application.model.entity.Node;

public interface NodeRepository extends JpaRepository<Node, Long> {
	
	Optional<Node> findByIdCompanyAndName(Long idCompany, String name);

	void deleteByRealPath(String realPath);

	Optional<Node> findByIdCompanyAndNameAndIdParentIsNull(Long idCompany, String name);

	List<Node> findByIdParent(Long idParent);

	boolean existsByIdParentAndName(Long idParent, String name);
	
    Optional<Node> findByNameAndIdCompanyIsNull(String name);
}
