package com.rfm.application.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rfm.application.model.dto.ActivityDTO;
import com.rfm.application.model.dto.ActivityRequest;
import com.rfm.application.service.ActivityService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityDTO> create(@RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.create(request));
    }

    @GetMapping("/filters")
    public ResponseEntity<List<ActivityDTO>> getFilters(
            @RequestParam (required = false) Long idCompany,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        return ResponseEntity.ok(activityService.findByCompanyAndDateRange(idCompany, start, end));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ActivityDTO> update(@PathVariable Long id, @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(activityService.findById(id));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}