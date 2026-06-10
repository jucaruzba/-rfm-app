package com.rfm.application.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rfm.application.model.entity.ProjectObject;

@Repository
public interface ProjectObjectRepository extends JpaRepository<ProjectObject, Long> {
    List<ProjectObject> findByIdProject(Long idProject);

    List<ProjectObject> findByIdParent(Long idParent);

    List<ProjectObject> findByIdProjectAndIdParentIsNull(Long idProject);

    Optional<ProjectObject> findByIdProjectAndTitle(Long idProject, String title);
}
