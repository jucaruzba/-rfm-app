package com.rfm.application.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.rfm.application.model.dto.TaskDTO;
import com.rfm.application.model.dto.TaskRequest;
import com.rfm.application.service.TaskService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

	private final TaskService taskService;

	@PostMapping
	public ResponseEntity<TaskDTO> create(@RequestBody TaskRequest request) {
		return ResponseEntity.ok(taskService.create(request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<TaskDTO> update(@PathVariable Long id, @RequestBody TaskRequest request) {
		return ResponseEntity.ok(taskService.update(id, request));
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<TaskDTO> updateStatus(@PathVariable Long id, @RequestParam String status) {
		return ResponseEntity.ok(taskService.updateStatus(id, status));
	}

	@GetMapping("/{id}")
	public ResponseEntity<TaskDTO> getById(@PathVariable Long id) {
		return ResponseEntity.ok(taskService.findById(id));
	}

	@GetMapping("/filters")
	public ResponseEntity<Page<TaskDTO>> getFilters(@RequestParam(required = false) Long idCompany,
			@RequestParam(required = false) String status, @RequestParam(required = false) Long idUserAssigned,
			@RequestParam(required = false) @DateTimeFormat(pattern = "dd/MM/yyyy") LocalDate start,
			@RequestParam(required = false) @DateTimeFormat(pattern = "dd/MM/yyyy") LocalDate end,
			@PageableDefault(page = 0, size = 10, sort = "idTask", direction = Sort.Direction.DESC) Pageable pageable) {
		Page<TaskDTO> tasksPage = taskService.findWithFilters(idCompany, status, idUserAssigned, start, end, pageable);

		return ResponseEntity.ok(tasksPage);
	}
	
	
	@GetMapping("/filter")
	public ResponseEntity<List<TaskDTO>> getFilter(@RequestParam(required = false) Long idCompany,
			@RequestParam(required = false) String status, @RequestParam(required = false) Long idUserAssigned,
			@RequestParam(required = false) @DateTimeFormat(pattern = "dd/MM/yyyy") LocalDate start,
			@RequestParam(required = false) @DateTimeFormat(pattern = "dd/MM/yyyy") LocalDate end) {
		List<TaskDTO> tasksList = taskService.findFilters(idCompany, status, idUserAssigned, start, end);

		return ResponseEntity.ok(tasksList);
	}
}