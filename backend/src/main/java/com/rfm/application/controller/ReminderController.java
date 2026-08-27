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

import com.rfm.application.enums.RepeatType;
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

    // Nuevo endpoint para obtener solo recordatorios activos (incluye repeticiones)
    @GetMapping("/active")
    public ResponseEntity<List<ReminderDTO>> findActiveReminders(@RequestParam Long idUser) {
        return ResponseEntity.ok(reminderService.findActiveReminders(idUser));
    }

    @GetMapping("/object")
    public ResponseEntity<List<ReminderDTO>> findByIdObject(@RequestParam Long idObject) {
        return ResponseEntity.ok(reminderService.findByIdObject(idObject));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReminderDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.findById(id));
    }

    // Nuevo endpoint para filtrar por tipo de repetición
    @GetMapping("/by-repeat-type")
    public ResponseEntity<List<ReminderDTO>> findByRepeatType(
            @RequestParam Long idUser,
            @RequestParam RepeatType repeatType) {
        return ResponseEntity.ok(reminderService.findByRepeatType(idUser, repeatType));
    }

    // Nuevo endpoint para obtener recordatorios en un rango de fechas (incluye repeticiones)
    @GetMapping("/by-date-range")
    public ResponseEntity<List<ReminderDTO>> findRemindersByDateRange(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime effectiveStart = startDate != null ? startDate : from;
        LocalDateTime effectiveEnd = endDate != null ? endDate : to;
        return ResponseEntity.ok(reminderService.findRemindersByDateRange(effectiveStart, effectiveEnd));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ReminderDTO>> findWithFilters(
            @RequestParam(required = false) Long idUser,
            @RequestParam(required = false) Boolean isCompleted,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) RepeatType repeatType) { // Nuevo parámetro opcional
        LocalDateTime effectiveStart = startDate != null ? startDate : from;
        LocalDateTime effectiveEnd = endDate != null ? endDate : to;
        return ResponseEntity.ok(reminderService.findWithFilters(idUser, isCompleted, effectiveStart, effectiveEnd, repeatType));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderDTO> update(@PathVariable Long id, @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ReminderDTO> markAsCompleted(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.markAsCompleted(id));
    }

    // Nuevo endpoint para marcar como completado y crear el siguiente recordatorio
    @PatchMapping("/{id}/complete-and-next")
    public ResponseEntity<ReminderDTO> markAsCompletedAndCreateNext(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.markAsCompletedAndCreateNext(id));
    }

    // Nuevo endpoint para obtener la cadena de recordatorios repetitivos
    @GetMapping("/{id}/chain")
    public ResponseEntity<List<ReminderDTO>> getReminderChain(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.getReminderChain(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reminderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Nuevo endpoint para eliminar toda la cadena de recordatorios repetitivos
    @DeleteMapping("/{id}/chain")
    public ResponseEntity<Void> deleteChain(@PathVariable Long id) {
        reminderService.deleteChain(id);
        return ResponseEntity.noContent().build();
    }
}