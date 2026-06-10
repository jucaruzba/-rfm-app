package com.rfm.application.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.rfm.application.model.dto.PendingItemDTO;
import com.rfm.application.model.dto.PendingItemRequest;
import com.rfm.application.service.PendingItemService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/pending-items")
@RequiredArgsConstructor
public class PendingItemController {

    private final PendingItemService pendingItemService;

    @PostMapping
    public ResponseEntity<PendingItemDTO> create(@RequestBody PendingItemRequest request) {
        return ResponseEntity.ok(pendingItemService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PendingItemDTO> update(@PathVariable Long id, @RequestBody PendingItemRequest request) {
        return ResponseEntity.ok(pendingItemService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pendingItemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PendingItemDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(pendingItemService.findById(id));
    }

    @GetMapping("/reference/{referenceId}")
    public ResponseEntity<List<PendingItemDTO>> getByReferenceId(@PathVariable Long referenceId) {
        return ResponseEntity.ok(pendingItemService.findByIdReference(referenceId));
    }
    
    @GetMapping("/filters")
    public ResponseEntity<Page<PendingItemDTO>> getFilters(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) String referenceType,
            @PageableDefault(page = 0, size = 10, sort = "idPending", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PendingItemDTO> page = pendingItemService.search(status, createdBy, assignedTo, referenceType, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<PendingItemDTO>> getFilter(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) String referenceType) {

        List<PendingItemDTO> list = pendingItemService.searchList(status, createdBy, assignedTo, referenceType);
        return ResponseEntity.ok(list);
    }
}
