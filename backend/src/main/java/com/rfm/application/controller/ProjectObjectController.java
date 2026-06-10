package com.rfm.application.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rfm.application.model.dto.ProjectObjectDTO;
import com.rfm.application.model.dto.ProjectObjectRequest;
import com.rfm.application.service.ProjectObjectService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/objects")
@RequiredArgsConstructor
public class ProjectObjectController {

    private final ProjectObjectService projectObjectService;

    @PostMapping
    public ResponseEntity<ProjectObjectDTO> create(@PathVariable Long projectId, @RequestBody ProjectObjectRequest request) {
        return ResponseEntity.ok(projectObjectService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectObjectDTO>> findAll(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectObjectService.findByIdProject(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectObjectDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(projectObjectService.findById(id));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<ProjectObjectDTO>> findChildren(@PathVariable Long id) {
        return ResponseEntity.ok(projectObjectService.findByIdParent(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectObjectDTO> update(@PathVariable Long id, @RequestBody ProjectObjectRequest request) {
        return ResponseEntity.ok(projectObjectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectObjectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
