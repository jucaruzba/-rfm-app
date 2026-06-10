package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption; 
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
@Service
public class FileStorageService {

    public String saveFile(MultipartFile file, String destinationPath) {
        try {
            if (file == null || file.isEmpty()) return null;
            String originalName = file.getOriginalFilename() != null 
                ? file.getOriginalFilename() 
                : "unnamed_file";
            String fileName = originalName.replace(" ", "_");
            
            Path uploadPath = Paths.get(destinationPath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            return filePath.toString();
            
        } catch (IOException e) {
            throw new RuntimeException("Error saving file to NAS: " + e.getMessage());
        }
    }
}