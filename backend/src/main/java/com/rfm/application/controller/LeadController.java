package com.rfm.application.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rfm.application.model.dto.LeadDTO;
import com.rfm.application.model.dto.LeadRequest;
import com.rfm.application.model.dto.LeadStageUpdateRequest;
import com.rfm.application.service.LeadService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Slf4j
public class LeadController {

    private final LeadService leadService;

    // --- GET ACTIVE PIPELINE LEADS ---
    @GetMapping
    public ResponseEntity<List<LeadDTO>> getActivePipelineLeads() {
        log.info("Fetching active pipeline leads");
        return ResponseEntity.ok(leadService.getActivePipelineLeads());
    }

    // --- GET ALL LEADS (INCLUDING WON/LOST) ---
    @GetMapping("/all")
    public ResponseEntity<List<LeadDTO>> getAllLeads() {
        log.info("Fetching all leads");
        return ResponseEntity.ok(leadService.getAllLeads());
    }

    // --- GET BY ID ---
    @GetMapping("/{id}")
    public ResponseEntity<LeadDTO> getById(@PathVariable Long id) {
        log.info("Fetching lead ID: {}", id);
        return ResponseEntity.ok(leadService.getLeadById(id));
    }

    // --- CREATE ---
    @PostMapping
    public ResponseEntity<LeadDTO> create(@RequestBody LeadRequest request) {
        log.info("Creating new lead: {}", request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(leadService.createLead(request));
    }

    // --- UPDATE ---
    @PutMapping("/{id}")
    public ResponseEntity<LeadDTO> update(@PathVariable Long id, @RequestBody LeadRequest request) {
        log.info("Updating lead ID: {}", id);
        return ResponseEntity.ok(leadService.updateLead(id, request));
    }

    // --- CHANGE STAGE (LOGGED ACTION) ---
    @PatchMapping("/{id}/stage")
    public ResponseEntity<LeadDTO> changeStage(@PathVariable Long id, @RequestBody LeadStageUpdateRequest request) {
        log.info("Changing stage for lead ID: {} to {}", id, request.newStatus());
        return ResponseEntity.ok(leadService.changeStage(id, request));
    }

    // --- MARK AS WON ---
    @PostMapping("/{id}/won")
    public ResponseEntity<LeadDTO> markAsWon(@PathVariable Long id) {
        log.info("Marking lead ID: {} as WON", id);
        return ResponseEntity.ok(leadService.markAsWon(id));
    }

    // --- MARK AS LOST ---
    @PostMapping("/{id}/lost")
    public ResponseEntity<LeadDTO> markAsLost(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        log.info("Marking lead ID: {} as CLOSED_LOST. Reason: {}", id, reason);
        return ResponseEntity.ok(leadService.markAsLost(id, reason));
    }

    // --- DELETE ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.warn("Deleting lead ID: {}", id);
        leadService.deleteLead(id);
        return ResponseEntity.noContent().build();
    }
}
