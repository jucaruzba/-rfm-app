package com.rfm.application.controller;

import com.rfm.application.model.dto.AuthenticationRequest;
import com.rfm.application.model.dto.AuthenticationResponse;
import com.rfm.application.model.dto.SessionResponse;
import com.rfm.application.model.entity.User;
import com.rfm.application.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
		return ResponseEntity.ok(authService.authenticate(request));
	}
	
	@GetMapping("/validate")
    public ResponseEntity<SessionResponse> validateSession(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        return ResponseEntity.ok(authService.validateTokenAndGetUser(authHeader));
    }
}