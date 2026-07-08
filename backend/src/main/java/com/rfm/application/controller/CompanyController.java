package com.rfm.application.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rfm.application.model.dto.CompanyDTO;
import com.rfm.application.model.dto.CompanyRequest;
import com.rfm.application.model.dto.TypeStatusParams;
import com.rfm.application.service.CompanyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Slf4j
public class CompanyController {

    private final CompanyService companyService;

    // --- CREATE ---
    @PostMapping
    public ResponseEntity<CompanyDTO> create(@RequestBody CompanyRequest request) {
        log.info("Creating new company: {}", request.name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.create(request));
    }

    // --- UPLOAD LOGO ---
    @PostMapping("/{id}/logo")
    public ResponseEntity<CompanyDTO> uploadLogo(@PathVariable Long id, 
                                                  @RequestPart("image") MultipartFile image) {
        log.info("Uploading logo for company ID: {}", id);
        return ResponseEntity.ok(companyService.uploadLogo(id, image));
    }

    // --- FIND ALL (EXCLUYE ARCHIVADAS) ---
    @GetMapping
    public ResponseEntity<List<CompanyDTO>> findAll() {
        log.info("Fetching all companies (excluding archived)");
        return ResponseEntity.ok(companyService.findAll());
    }

    // --- FIND ALL INCLUDING ARCHIVED ---
    @GetMapping("/all")
    public ResponseEntity<List<CompanyDTO>> findAllIncludingArchived() {
        log.info("Fetching all companies (including archived)");
        return ResponseEntity.ok(companyService.findAllIncludingArchived());
    }

    // --- FIND ONLY ARCHIVED ---
    @GetMapping("/archived")
    public ResponseEntity<List<CompanyDTO>> findAllArchived() {
        log.info("Fetching only archived companies");
        return ResponseEntity.ok(companyService.findAllArchived());
    }

    // --- FIND ONLY ACTIVE ---
    @GetMapping("/active")
    public ResponseEntity<List<CompanyDTO>> findAllActive() {
        log.info("Fetching only active companies");
        return ResponseEntity.ok(companyService.findAllActive());
    }

    // --- FIND BY ID ---
    @GetMapping("/{id}")
    public ResponseEntity<CompanyDTO> findById(@PathVariable Long id) {
        log.info("Fetching company by ID: {}", id);
        return ResponseEntity.ok(companyService.findById(id));
    }

    // --- ARCHIVE COMPANY (SOFT DELETE) ---
    @DeleteMapping("/{id}")
    public ResponseEntity<CompanyDTO> delete(@PathVariable Long id) {
        log.info("Archiving company with ID: {}", id);
        CompanyDTO archivedCompany = companyService.delete(id);
        return ResponseEntity.ok(archivedCompany);
    }

    // --- RESTORE COMPANY ---
    @PatchMapping("/{id}/restore")
    public ResponseEntity<CompanyDTO> restore(@PathVariable Long id) {
        log.info("Restoring company with ID: {}", id);
        return ResponseEntity.ok(companyService.restoreCompany(id));
    }

    // --- HARD DELETE (SOLO PARA EMPRESAS SIN DATOS) ---
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<Void> hardDelete(@PathVariable Long id) {
        log.warn("Hard deleting company with ID: {}", id);
        companyService.hardDelete(id);
        return ResponseEntity.noContent().build();
    }

    // --- UPDATE TYPE AND STATUS ---
    @PatchMapping("/{id}/type-status-params")
    public ResponseEntity<CompanyDTO> updateTypeAndStatusParams(@PathVariable Long id,
                                                                @RequestBody TypeStatusParams params) {
        log.info("Updating type and status for company ID: {} - Type: {}, Status: {}", 
                 id, params.getType(), params.getStatus());
        return ResponseEntity.ok(companyService.updateTypeAndStatus(id, params.getType(), params.getStatus()));
    }

    // --- CHECK IF COMPANY HAS DATA ---
    @GetMapping("/{id}/has-data")
    public ResponseEntity<Boolean> hasImportantData(@PathVariable Long id) {
        log.info("Checking if company ID: {} has important data", id);
        return ResponseEntity.ok(companyService.hasImportantData(id));
    }
}