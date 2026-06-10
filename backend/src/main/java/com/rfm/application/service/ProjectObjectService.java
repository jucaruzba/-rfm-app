package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.ProjectObjectDTO;
import com.rfm.application.model.dto.ProjectObjectRequest;
import com.rfm.application.model.entity.Node;
import com.rfm.application.model.entity.Project;
import com.rfm.application.model.entity.ProjectObject;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.ProjectObjectRepository;
import com.rfm.application.repository.ProjectRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectObjectService {

    private final ProjectObjectRepository projectObjectRepository;
    private final ProjectRepository projectRepository;
    private final NodeRepository nodeRepository;
    private final UserRepository userRepository;

    @Value("${project.storage.root-path}")
    private String nasRootPath;

    @Transactional
    public ProjectObjectDTO create(ProjectObjectRequest request) {


        // Validar proyecto
        Project project = projectRepository.findById(request.idProject())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + request.idProject()));

        if (project.getIdNode() == null) {
            throw new RuntimeException("Project has no root node");
        }

        // Validar padre si existe y obtener su nodeId
        Long parentNodeId;
        if (request.idParent() != null) {
            ProjectObject parent = projectObjectRepository.findById(request.idParent())
                    .orElseThrow(() -> new RuntimeException("Parent object not found with id: " + request.idParent()));
            
            if (!parent.getIdProject().equals(request.idProject())) {
                throw new RuntimeException("Parent object does not belong to the same project");
            }
            
            if (parent.getIdNode() == null) {
                throw new RuntimeException("Parent object has no associated node");
            }
            
            parentNodeId = parent.getIdNode();
        } else {
            parentNodeId = project.getIdNode();
        }

        // Crear directorio físico
        String folderName = request.title().toUpperCase().replace(" ", "_");
        Node projectRootNode = nodeRepository.findById(project.getIdNode())
                .orElseThrow(() -> new RuntimeException("Project root node not found"));

        Path objectPath = Paths.get(projectRootNode.getRealPath(), folderName);

        try {
            Files.createDirectories(objectPath);
        } catch (IOException e) {
            throw new RuntimeException("Error creating object directory: " + e.getMessage());
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. PRIMERO crear y guardar el Node
        Node objectNode = Node.builder()
                .name(request.title())
                .description("Folder for object " + request.title())
                .nodeType("FOLDER")
                .realPath(objectPath.toString())
                .idParent(parentNodeId)
                .build();
        objectNode = nodeRepository.save(objectNode);

        // 2. LUEGO crear y guardar ProjectObject con el idNode
        ProjectObject projectObject = ProjectObject.builder()
                .title(request.title())
                .description(request.description())
                .idProject(request.idProject())
                .idParent(request.idParent())
                .createdBy(request.createdBy())
                .createdAt(now)
                .updatedAt(now)
                .idNode(objectNode.getIdNode())
                .build();

        projectObject = projectObjectRepository.save(projectObject);

        return mapToDTO(projectObject);
    }

    public List<ProjectObjectDTO> findByIdProject(Long idProject) {
        if (idProject == null) {
            throw new IllegalArgumentException("idProject cannot be null");
        }
        return projectObjectRepository.findByIdProject(idProject)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ProjectObjectDTO> findByIdParent(Long idParent) {
        if (idParent == null) {
            throw new IllegalArgumentException("idParent cannot be null");
        }
        return projectObjectRepository.findByIdParent(idParent)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public ProjectObjectDTO findById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id cannot be null");
        }
        return projectObjectRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("ProjectObject not found with id: " + id));
    }

    @Transactional
    public ProjectObjectDTO update(Long id, ProjectObjectRequest request) {
        if (id == null) {
            throw new IllegalArgumentException("id cannot be null");
        }
        
        ProjectObject projectObject = projectObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProjectObject not found with id: " + id));

        if (request.title() != null) {
            projectObject.setTitle(request.title());
        }
        if (request.description() != null) {
            projectObject.setDescription(request.description());
        }
        projectObject.setUpdatedAt(LocalDateTime.now());

        projectObject = projectObjectRepository.save(projectObject);
        return mapToDTO(projectObject);
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id cannot be null");
        }
        
        ProjectObject projectObject = projectObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProjectObject not found with id: " + id));
        
        // Eliminar el directorio físico si existe
        if (projectObject.getIdNode() != null) {
            nodeRepository.findById(projectObject.getIdNode()).ifPresent(node -> {
                try {
                    Path path = Paths.get(node.getRealPath());
                    if (Files.exists(path)) {
                        Files.delete(path);
                    }
                } catch (IOException e) {
                    System.err.println("Could not delete directory: " + e.getMessage());
                }
            });
        }
        
        projectObjectRepository.deleteById(id);
    }

    private ProjectObjectDTO mapToDTO(ProjectObject projectObject) {
        // Validar y obtener username del createdBy
        String createdByUsername = "Unknown User";
        if (projectObject.getCreatedBy() != null) {
            try {
                createdByUsername = userRepository.findById(projectObject.getCreatedBy())
                        .map(user -> user.getUsername())
                        .orElse("Unknown User");
            } catch (Exception e) {
                System.err.println("Error fetching user: " + e.getMessage());
            }
        }

        // Obtener título del padre si existe
        String parentTitle = null;
        if (projectObject.getIdParent() != null) {
            try {
                parentTitle = projectObjectRepository.findById(projectObject.getIdParent())
                        .map(ProjectObject::getTitle)
                        .orElse(null);
            } catch (Exception e) {
                System.err.println("Error fetching parent: " + e.getMessage());
            }
        }

        return ProjectObjectDTO.builder()
                .idObject(projectObject.getIdObject())
                .title(projectObject.getTitle())
                .description(projectObject.getDescription())
                .idProject(projectObject.getIdProject())
                .idParent(projectObject.getIdParent())
                .parentTitle(parentTitle)
                .idNode(projectObject.getIdNode())
                .createdBy(projectObject.getCreatedBy())
                .createdByUsername(createdByUsername)
                .createdAt(projectObject.getCreatedAt())
                .updatedAt(projectObject.getUpdatedAt())
                .build();
    }
}