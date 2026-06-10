package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.ProjectDTO;
import com.rfm.application.model.dto.ProjectRequest;
import com.rfm.application.model.entity.Node;
import com.rfm.application.model.entity.Project;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.ProjectRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final NodeRepository nodeRepository;
    private final UserRepository userRepository;

    @Value("${project.storage.root-path}")
    private String nasRootPath;

    @Transactional
    public ProjectDTO create(ProjectRequest request) {
        String folderName = request.title().toUpperCase().replace(" ", "_");
        Path projectPath = Paths.get(nasRootPath, folderName);

        try {
            Files.createDirectories(projectPath);
        } catch (IOException e) {
            throw new RuntimeException("Error creating directory structure: " + e.getMessage());
        }

        LocalDateTime now = LocalDateTime.now();
        
        // 1. PRIMERO crear y guardar el Node
        Node rootNode = Node.builder()
                .name(request.title())
                .description("Root folder for project " + request.title())
                .nodeType("FOLDER")
                .realPath(projectPath.toString())
                .idParent(null)
                .build();
        rootNode = nodeRepository.save(rootNode);  // ✅ Guardar Node PRIMERO
        
        // 2. LUEGO crear el Project con el idNode del Node
        Project project = Project.builder()
                .title(request.title())
                .description(request.description())
                .createdBy(request.createdBy())
                .createdAt(now)
                .updatedAt(now)
                .idNode(rootNode.getIdNode())  // ✅ Asignar el ID del Node
                .build();
        
        // 3. Finalmente guardar Project
        project = projectRepository.save(project);
        
        return mapToDTO(project);
    }
    

    public List<ProjectDTO> findAll() {
        return projectRepository.findAll().stream().map(this::mapToDTO).toList();
    }

    public ProjectDTO findById(Long id) {
        return projectRepository.findById(id).map(this::mapToDTO).orElseThrow();
    }

    public List<ProjectDTO> findByCreatedBy(Long createdBy) {
        return projectRepository.findByCreatedBy(createdBy).stream().map(this::mapToDTO).toList();
    }

    @Transactional
    public ProjectDTO update(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setUpdatedAt(LocalDateTime.now());

        project = projectRepository.save(project);
        return mapToDTO(project);
    }

    @Transactional
    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    private ProjectDTO mapToDTO(Project project) {
        String createdByUsername = userRepository.findById(project.getCreatedBy())
                .map(u -> u.getUsername())
                .orElse("Unknown User");

        return ProjectDTO.builder()
                .idProject(project.getIdProject())
                .title(project.getTitle())
                .description(project.getDescription())
                .idNode(project.getIdNode())
                .createdBy(project.getCreatedBy())
                .createdByUsername(createdByUsername)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
