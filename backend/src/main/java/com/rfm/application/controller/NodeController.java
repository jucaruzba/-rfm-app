package com.rfm.application.controller;

import com.rfm.application.model.dto.CreateFolderDTO;
import com.rfm.application.model.entity.Node;
import com.rfm.application.service.NodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/nodes")
@RequiredArgsConstructor
public class NodeController {

    private final NodeService nodeService;

    /**
     * Obtiene el nodo raíz (Home) de una empresa.
     * GET /api/v1/nodes/root/1
     */
    @GetMapping("/root/{idCompany}")
    public ResponseEntity<Node> getRootNode(@PathVariable Long idCompany) {
        return ResponseEntity.ok(nodeService.getRootNodeByCompany(idCompany));
    }

    /**
     * Lista el contenido de una carpeta.
     * GET /api/v1/nodes/parent/5
     */
    @GetMapping("/parent/{idParent}")
    public ResponseEntity<List<Node>> getNodesByParent(@PathVariable Long idParent) {
        return ResponseEntity.ok(nodeService.getNodesByParent(idParent));
    }

    /**
     * Crea una nueva carpeta dentro de un nodo padre.
     * POST /api/v1/nodes/folder
     */
    @PostMapping("/folder")
    public ResponseEntity<Node> createFolder(@RequestBody CreateFolderDTO createFolderDTO) {
        return ResponseEntity.ok(nodeService.createFolder(createFolderDTO));
    }

    /**
     * Sube un archivo a una carpeta específica.
     * Se usa multipart/form-data.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Node> uploadFile(
            @RequestParam Long idParent,
            @RequestParam (required = false)Long idCompany,
            @RequestParam(required = false) String description,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(nodeService.uploadFile(idParent, file, description, idCompany));
    }
    
    @DeleteMapping("/{idNode}")
    public ResponseEntity<?> deleteFile(@PathVariable Long idNode) {
        try {
            nodeService.deleteFile(idNode);
            return ResponseEntity.ok().body("File deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}