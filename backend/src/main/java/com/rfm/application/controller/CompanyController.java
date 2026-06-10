package com.rfm.application.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

	private final CompanyService companyService;

	@PostMapping
	public ResponseEntity<CompanyDTO> create(@RequestBody CompanyRequest request) {
		return ResponseEntity.ok(companyService.create(request));
	}

	@PostMapping("/{id}/logo")
	public ResponseEntity<CompanyDTO> uploadLogo(@PathVariable Long id, @RequestPart("image") MultipartFile image) {
		return ResponseEntity.ok(companyService.uploadLogo(id, image));
	}

	@GetMapping
	public ResponseEntity<List<CompanyDTO>> findAll() {
		return ResponseEntity.ok(companyService.findAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<CompanyDTO> findById(@PathVariable Long id) {
		return ResponseEntity.ok(companyService.findById(id));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		companyService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/{id}/type-status-params")
	public ResponseEntity<CompanyDTO> updateTypeAndStatusParams(@PathVariable Long id,
			@RequestBody TypeStatusParams params) {
		return ResponseEntity.ok(companyService.updateTypeAndStatus(id, params.getType(), params.getStatus()));
	}

}