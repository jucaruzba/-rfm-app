package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;

import com.rfm.application.model.dto.ProjectDTO;
import com.rfm.application.model.dto.ProjectRequest;
import com.rfm.application.model.entity.Node;
import com.rfm.application.model.entity.Project;
import com.rfm.application.model.entity.ProjectObject;
import com.rfm.application.model.entity.Reminder;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.ProjectObjectRepository;
import com.rfm.application.repository.ProjectRepository;
import com.rfm.application.repository.ReminderRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final NodeRepository nodeRepository;
    private final UserRepository userRepository;
    private final ProjectObjectRepository projectObjectRepository;
    private final ReminderRepository reminderRepository;
    private final NodeService nodeService;

    @Value("${project.storage.root-path}")
    private String nasRootPath;

    @Transactional
    public ProjectDTO create(ProjectRequest request) {
        String folderName = request.title().toUpperCase().replace(" ", "_");
        Path projectPath = Paths.get(nasRootPath, folderName);

        try {
            Files.createDirectories(projectPath);
        } catch (IOException e) {
            throw new RuntimeException("Error creating project directory: " + e.getMessage());
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
        rootNode = nodeRepository.save(rootNode);

        // 2. LUEGO crear y guardar el Project con el idNode ya existente
        Project project = Project.builder()
                .title(request.title())
                .description(request.description())
                .createdBy(request.createdBy())
                .idNode(rootNode.getIdNode())
                .createdAt(now)
                .updatedAt(now)
                .build();
        project = projectRepository.save(project);

        return mapToDTO(project);
    }

    public List<ProjectDTO> findAll() {
        return projectRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public ProjectDTO findById(Long id) {
        return projectRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    public List<ProjectDTO> findByCreatedBy(Long userId) {
        return projectRepository.findByCreatedBy(userId).stream()
                .map(this::mapToDTO)
                .toList();
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
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        Long rootNodeId = project.getIdNode();

        // 1. Obtener todos los objetos pertenecientes al proyecto
        List<ProjectObject> projectObjects = projectObjectRepository.findByIdProject(id);
        List<Long> projectObjectNodeIds = projectObjects.stream()
                .map(ProjectObject::getIdNode)
                .filter(Objects::nonNull)
                .toList();

        // 2. Eliminar recordatorios asociados a cualquiera de los objetos del proyecto
        for (ProjectObject obj : projectObjects) {
            if (obj.getIdObject() != null) {
                List<Reminder> reminders = reminderRepository.findByIdObject(obj.getIdObject());
                if (!reminders.isEmpty()) {
                    reminderRepository.deleteAll(reminders);
                }
            }
        }
        reminderRepository.flush();

        // 3. Romper autorreferencias en ProjectObject (id_parent) y eliminar todos los ProjectObjects
        if (!projectObjects.isEmpty()) {
            for (ProjectObject obj : projectObjects) {
                if (obj.getIdParent() != null) {
                    obj.setIdParent(null);
                    projectObjectRepository.save(obj);
                }
            }
            projectObjectRepository.flush();
            projectObjectRepository.deleteAll(projectObjects);
            projectObjectRepository.flush();
        }

        // 4. Obtener la ruta física del nodo raíz antes de borrar
        String physicalRootPath = null;
        if (rootNodeId != null) {
            physicalRootPath = nodeRepository.findById(rootNodeId)
                    .map(Node::getRealPath)
                    .orElse(null);
        }

        // 5. Eliminar el proyecto de la BD
        // CRÍTICO: 'projects.id_node' referencia a 'nodes.id_node'. Por lo tanto, el registro
        // en la tabla 'projects' DEBE ser eliminado y flusheado ANTES que los registros de 'nodes'
        // para evitar la violación de restricción de clave foránea 'projects_nodes_fk'.
        projectRepository.delete(project);
        projectRepository.flush();

        // 6. Ahora que 'projects' y 'project_objects' fueron eliminados de la BD,
        // procedemos a eliminar recursivamente los nodos de la BD y sus archivos en disco.
        for (Long objNodeId : projectObjectNodeIds) {
            if (nodeRepository.existsById(objNodeId)) {
                nodeService.deleteNodeRecursively(objNodeId);
            }
        }
        if (rootNodeId != null && nodeRepository.existsById(rootNodeId)) {
            nodeService.deleteNodeRecursively(rootNodeId);
        }
        nodeRepository.flush();

        // 7. Limpieza física final de la carpeta en disco por si quedó algún rastro
        if (physicalRootPath != null) {
            try {
                Path projectPath = Paths.get(physicalRootPath);
                if (Files.exists(projectPath)) {
                    FileSystemUtils.deleteRecursively(projectPath);
                    log.info("Deleted physical directory for project {}: {}", id, projectPath);
                }
            } catch (Exception e) {
                log.warn("Could not delete physical directory for project {}: {}", id, e.getMessage());
            }
        }

        log.info("Project {} deleted successfully with all related records and files.", id);
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
