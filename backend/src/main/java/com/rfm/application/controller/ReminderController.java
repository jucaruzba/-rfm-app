package com.rfm.application.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rfm.application.model.dto.ReminderDTO;
import com.rfm.application.model.dto.ReminderRequest;
import com.rfm.application.service.ReminderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping
    public ResponseEntity<ReminderDTO> create(@RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ReminderDTO>> findByIdUser(@RequestParam Long idUser) {
        return ResponseEntity.ok(reminderService.findByIdUser(idUser));
    }

    @GetMapping("/object")
    public ResponseEntity<List<ReminderDTO>> findByIdObject(@RequestParam Long idObject) {
        return ResponseEntity.ok(reminderService.findByIdObject(idObject));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReminderDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.findById(id));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ReminderDTO>> findWithFilters(
            @RequestParam(required = false) Long idUser,
            @RequestParam(required = false) Boolean isCompleted,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reminderService.findWithFilters(idUser, isCompleted, startDate, endDate));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderDTO> update(@PathVariable Long id, @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ReminderDTO> markAsCompleted(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.markAsCompleted(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reminderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
