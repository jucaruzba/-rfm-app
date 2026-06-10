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
import com.rfm.application.repository.CompanyRepository;
import com.rfm.application.repository.NodeRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final NodeRepository nodeRepository;
    private final FileStorageService fileStorageService;

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

        return mapToDTO(company);
    }

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

        return mapToDTO(company);
    }
    // --- OTHER METHODS ---
    public List<CompanyDTO> findAll() {
        return companyRepository.findAll().stream().map(this::mapToDTO).toList();
    }

    public CompanyDTO findById(Long id) {
        return companyRepository.findById(id).map(this::mapToDTO).orElseThrow();
    }


    public void delete(Long id) {
        companyRepository.deleteById(id);
    }

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
                .build();
    }
    
    
    @Transactional
    public CompanyDTO updateTypeAndStatus(Long idCompany, CompanyType newType, CompanyStatus newStatus) {
        Company company = companyRepository.findById(idCompany)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + idCompany));
        
        company.setType(newType);
        company.setStatus(newStatus);
        
        company = companyRepository.save(company);
        return mapToDTO(company);
    }
}