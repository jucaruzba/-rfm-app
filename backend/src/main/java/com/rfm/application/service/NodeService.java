package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.rfm.application.model.dto.CreateFolderDTO;
import com.rfm.application.model.entity.Company;
import com.rfm.application.model.entity.Node;
import com.rfm.application.repository.CompanyRepository;
import com.rfm.application.repository.NodeRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NodeService {

    private final NodeRepository nodeRepository;
    private final FileStorageService fileStorageService;
    private final CompanyRepository companyRepository;

    /**
     * Safely gets the root node of a company.
     * Searches by Company + Company Name + Parent Null.
     */
    public Node getRootNodeByCompany(Long idCompany) {
        Company company = companyRepository.findById(idCompany)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        return nodeRepository.findByIdCompanyAndNameAndIdParentIsNull(idCompany, company.getName())
                .orElseThrow(() -> new RuntimeException("Critical error: Root folder for company " + company.getName() + " not found"));
    }

    /**
     * Retrieves direct children of a node.
     */
    public List<Node> getNodesByParent(Long idParent) {
        return nodeRepository.findByIdParent(idParent);
    }

    /**
     * CREATE GENERIC FOLDER
     */
    @Transactional
    public Node createFolder(CreateFolderDTO createFolderDTO) {
        Node parentNode = nodeRepository.findById(createFolderDTO.idParent())
                .orElseThrow(() -> new RuntimeException("Destination folder not found"));

        if (nodeRepository.existsByIdParentAndName(createFolderDTO.idParent(), createFolderDTO.folderName())) {
            throw new RuntimeException("A folder named '" + createFolderDTO.folderName() + "' already exists in this location.");
        }
        Path newFolderPath = Paths.get(parentNode.getRealPath(), createFolderDTO.folderName().toUpperCase().replace(" ", "_"));

        try {
            if (!Files.exists(newFolderPath)) {
                Files.createDirectories(newFolderPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error creating physical directory: " + e.getMessage());
        }

        Node newNode = Node.builder()
                .name(createFolderDTO.folderName())
                .description(createFolderDTO.description())
                .nodeType("FOLDER")
                .realPath(newFolderPath.toString())
                .idParent(createFolderDTO.idParent())
                .idCompany(createFolderDTO.idCompany())
                .build();

        return nodeRepository.save(newNode);
    }

    /**
     * UPLOAD GENERIC FILE
     */
    @Transactional
    public Node uploadFile(Long idParent, MultipartFile file, String description, Long idCompany) {
        Node parentNode = nodeRepository.findById(idParent)
                .orElseThrow(() -> new RuntimeException("Destination folder not found"));

        if (!"FOLDER".equals(parentNode.getNodeType())) {
            throw new RuntimeException("Cannot upload files to a node that is not a folder.");
        }

        String finalPath = fileStorageService.saveFile(file, parentNode.getRealPath());

        Long companyIdToSave = (idCompany != null && idCompany > 0) ? idCompany : null;

        Node fileNode = Node.builder()
                .name(file.getOriginalFilename())
                .description(description)
                .nodeType("FILE")
                .realPath(finalPath)
                .idParent(idParent)
                .idCompany(companyIdToSave)
                .build();

        return nodeRepository.save(fileNode);
    }
    
    /**
     * DELETE FILE ONLY - Removes file from database and disk
     */
    @Transactional
    public void deleteFile(Long idNode) {
        Node node = nodeRepository.findById(idNode)
                .orElseThrow(() -> new RuntimeException("Node not found with id: " + idNode));
        
        if (!"FILE".equals(node.getNodeType())) {
            throw new RuntimeException("This method only deletes files. Node type is: " + node.getNodeType());
        }
        
        try {
            // Delete physical file from disk
            Path filePath = Paths.get(node.getRealPath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted from disk: {}", filePath);
            } else {
                log.warn("File not found on disk: {}", filePath);
            }
            
            // Delete database record
            nodeRepository.delete(node);
            log.info("File node deleted from database: id={}, name={}", idNode, node.getName());
            
        } catch (IOException e) {
            throw new RuntimeException("Error deleting file: " + e.getMessage(), e);
        }
    }
}