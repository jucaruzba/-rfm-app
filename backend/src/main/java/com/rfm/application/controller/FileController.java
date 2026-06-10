package com.rfm.application.controller;

//Java NIO (File System)
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

//Spring Core & Web
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//Modelos y Repositorios (Ajusta los paquetes según tu estructura)
import com.rfm.application.model.entity.Node;
import com.rfm.application.repository.NodeRepository;

@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final NodeRepository nodeRepository;
	@Value("${project.storage.root-nass-path}")
	private String NAS;

    @GetMapping("/view/{idNode}")
    public ResponseEntity<Resource> viewFile(@PathVariable Long idNode) {
        Node node = nodeRepository.findById(idNode)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        try {
            Path path = Paths.get(node.getRealPath());
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                // Determinamos el tipo de contenido (pdf, png, etc)
                String contentType = Files.probeContentType(path);
                if (contentType == null) contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + node.getName() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read file");
            }
        } catch (IOException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/{*path}")
    public ResponseEntity<Resource> getFile(@PathVariable String path) {
        try {
            String cleanPath = path.startsWith("/") ? path.substring(1) : path;
            cleanPath = cleanPath.replace("\\", "/");

            Path filePath = Paths.get(NAS).resolve(cleanPath).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            log.info("cleanpath----->"+filePath.toUri().toString());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType != null ? contentType : "image/jpeg"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}