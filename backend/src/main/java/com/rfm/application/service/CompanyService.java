package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;
import com.rfm.application.model.dto.CompanyDTO;
import com.rfm.application.model.dto.CompanyRequest;
import com.rfm.application.model.entity.Company;
import com.rfm.application.model.entity.Node;
import com.rfm.application.repository.ActivityRepository;
import com.rfm.application.repository.CompanyRepository;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.TaskRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final NodeRepository nodeRepository;
    private final FileStorageService fileStorageService;
    private final ActivityRepository activityRepository;
    private final TaskRepository taskRepository;

    @Value("${project.storage.root-path}")
    private String nasRootPath;

    // --- CREATE ---
    @Transactional
    public CompanyDTO create(CompanyRequest request) {
        // 1. Create physical folder on NAS
        String folderName = request.name().toUpperCase().replace(" ", "_");
        Path companyPath = Paths.get(nasRootPath, folderName);
        
        try {
            Files.createDirectories(companyPath);
            Files.createDirectories(companyPath.resolve("TASK"));
            Files.createDirectories(companyPath.resolve("ACTIVITIES"));
            Files.createDirectories(companyPath.resolve("LOGO"));
        } catch (IOException e) {
            throw new RuntimeException("Error creating directory structure: " + e.getMessage());
        }

        // 2. Save Company in DB
        Company company = Company.builder()
                .name(request.name())
                .description(request.description())
                .nas_root_folder(companyPath.toString())
                .type(request.type())
                .status(request.status())  
                .build();
        company = companyRepository.save(company);

        // 3. Create Root Node (Parent)
        Node rootNode = createNode(request.name(), "Root folder for " + request.name(), 
                                  "FOLDER", companyPath.toString(), null, company.getIdCompany());
        
        // 4. Create default child nodes
        createNode("TASK", "Task folder", "FOLDER", companyPath.resolve("TASK").toString(), 
                   rootNode.getIdNode(), company.getIdCompany());
        createNode("ACTIVITIES", "Activities folder", "FOLDER", companyPath.resolve("ACTIVITIES").toString(), 
                   rootNode.getIdNode(), company.getIdCompany());
        createNode("LOGO", "Logo folder", "FOLDER", companyPath.resolve("LOGO").toString(), 
                   rootNode.getIdNode(), company.getIdCompany());

        log.info("Company created successfully: {} (ID: {})", company.getName(), company.getIdCompany());
        return mapToDTO(company);
    }

    // --- UPLOAD LOGO ---
    @Transactional
    public CompanyDTO uploadLogo(Long idCompany, MultipartFile file) {
        Company company = companyRepository.findById(idCompany)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        Node logoFolderNode = nodeRepository.findByIdCompanyAndName(idCompany, "LOGO")
                .orElseThrow(() -> new RuntimeException("LOGO folder not found"));
        if (company.getLogoPath() != null) {
            try { 
                Files.deleteIfExists(Paths.get(company.getLogoPath()));
                nodeRepository.deleteByRealPath(company.getLogoPath());
                nodeRepository.flush();
            } catch (IOException e) {
                log.warn("Error deleting old logo: {}", e.getMessage());
            }
        }
        String newFilePath = fileStorageService.saveFile(file, logoFolderNode.getRealPath());
        company.setLogoPath(newFilePath);
        company = companyRepository.save(company);
        Node logoFileNode = Node.builder()
                .name(file.getOriginalFilename())
                .description("Official logo for company " + company.getName())
                .nodeType("FILE")
                .realPath(newFilePath)
                .idParent(logoFolderNode.getIdNode())
                .idCompany(idCompany)
                .build();
        
        nodeRepository.save(logoFileNode);

        log.info("Logo uploaded for company: {} (ID: {})", company.getName(), idCompany);
        return mapToDTO(company);
    }

    // --- FIND METHODS ---
    
    // Obtener todas las empresas NO archivadas (por defecto, con orden fijo: ACTIVE, IN_PROGRESS, ON_HOLD)
    public List<CompanyDTO> findAll() {
        log.debug("Fetching all active companies (excluding archived) with fixed status ordering");
        return companyRepository.findAllActiveOrdered()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Obtener todas las empresas incluyendo archivadas (con orden fijo: ACTIVE, IN_PROGRESS, ON_HOLD, ARCHIVED)
    public List<CompanyDTO> findAllIncludingArchived() {
        log.debug("Fetching all companies including archived with fixed status ordering");
        return companyRepository.findAllOrdered()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Obtener solo empresas archivadas
    public List<CompanyDTO> findAllArchived() {
        log.debug("Fetching only archived companies");
        return companyRepository.findByStatus(CompanyStatus.ARCHIVED)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Obtener empresas activas (ACTIVE, IN_PROGRESS, ON_HOLD)
    public List<CompanyDTO> findAllActive() {
        log.debug("Fetching all active companies with fixed status ordering");
        return companyRepository.findAllActiveOrdered()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public CompanyDTO findById(Long id) {
        return companyRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
    }

    // --- ARCHIVE / RESTORE METHODS (SOFT DELETE) ---

    /**
     * Archiva una empresa (soft delete). Cambia el estado a ARCHIVED.
     * La empresa ya no aparecerá en las listas principales pero los datos se conservan.
     */
    @Transactional
    public CompanyDTO archiveCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        
        // Verificar si ya está archivada
        if (company.getStatus() == CompanyStatus.ARCHIVED) {
            log.warn("Company already archived: {} (ID: {})", company.getName(), id);
            return mapToDTO(company);
        }
        
        // Cambiar estado a ARCHIVED
        company.setStatus(CompanyStatus.ARCHIVED);
        company = companyRepository.save(company);
        
        log.info("Company archived successfully: {} (ID: {})", company.getName(), id);
        return mapToDTO(company);
    }

    /**
     * Restaura una empresa archivada. Cambia el estado a ACTIVE.
     * La empresa volverá a aparecer en las listas principales.
     */
    @Transactional
    public CompanyDTO restoreCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        
        // Verificar si no está archivada
        if (company.getStatus() != CompanyStatus.ARCHIVED) {
            log.warn("Company is not archived: {} (ID: {})", company.getName(), id);
            return mapToDTO(company);
        }
        
        // Restaurar a ACTIVE (o podrías restaurar al estado anterior si lo guardaras)
        company.setStatus(CompanyStatus.ACTIVE);
        company = companyRepository.save(company);
        
        log.info("Company restored successfully: {} (ID: {})", company.getName(), id);
        return mapToDTO(company);
    }

    /**
     * Verifica si una empresa tiene datos importantes (actividades o tareas)
     */
    /**
     * Verifica si una empresa tiene datos importantes (actividades o tareas)
     */
    public boolean hasImportantData(Long companyId) {
        // Contar activities de la empresa
        long activitiesCount = activityRepository.countByIdCompany(companyId);
        
        // Contar tasks de la empresa
        long tasksCount = taskRepository.countByIdCompany(companyId);
        
        // Si tiene al menos una actividad o una tarea, tiene datos importantes
        return activitiesCount > 0 || tasksCount > 0;
    }
    
    /**
     * Elimina una empresa. 
     * Si tiene datos importantes, solo la archiva.
     * Si no tiene datos, la elimina físicamente (opcional).
     * Por ahora solo archiva siempre.
     */
    @Transactional
    public CompanyDTO delete(Long id) {
        return archiveCompany(id);
    }

    /**
     * Eliminación física real (hard delete) - SOLO para empresas sin datos
     * Úsalo con precaución
     */
    @Transactional
    public void hardDelete(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        
        if (hasImportantData(id)) {
            throw new RuntimeException("Cannot delete company with data. Use archive instead.");
        }
        
        try {
            Path companyPath = Paths.get(company.getNas_root_folder());
            if (Files.exists(companyPath)) {
                deleteDirectoryRecursively(companyPath);
                log.info("Physical files deleted for company: {}", company.getName());
            }
        } catch (IOException e) {
            log.error("Error deleting physical files for company: {}", company.getName(), e);
        }
        
        companyRepository.deleteById(id);
        log.info("Company hard deleted: {} (ID: {})", company.getName(), id);
    }

    @Transactional
    public CompanyDTO updateTypeAndStatus(Long idCompany, CompanyType newType, CompanyStatus newStatus) {
        Company company = companyRepository.findById(idCompany)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + idCompany));
        
        company.setType(newType);
        company.setStatus(newStatus);
        
        company = companyRepository.save(company);
        log.info("Company updated: {} (ID: {}) - Type: {}, Status: {}", 
                 company.getName(), idCompany, newType, newStatus);
        return mapToDTO(company);
    }

    // --- PRIVATE METHODS ---

    private Node createNode(String name, String desc, String type, String path, Long parentId, Long companyId) {
        Node node = Node.builder()
                .name(name)
                .description(desc)
                .nodeType(type)
                .realPath(path)
                .idParent(parentId)
                .idCompany(companyId)
                .build();
        return nodeRepository.save(node);
    }

    private CompanyDTO mapToDTO(Company c) {
        return CompanyDTO.builder()
                .idCompany(c.getIdCompany())
                .name(c.getName())
                .description(c.getDescription())
                .logoPath(c.getLogoPath())
                .nasRootFolder(c.getNas_root_folder())
                .type(c.getType())
                .status(c.getStatus())
                .build();
    }

    private void deleteDirectoryRecursively(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (var entries = Files.list(path)) {
                for (Path entry : entries.toList()) {
                    deleteDirectoryRecursively(entry);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}