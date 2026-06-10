	package com.rfm.application.controller;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rfm.application.model.dto.ForgotPasswordDTO;
import com.rfm.application.model.dto.UserDTO;
import com.rfm.application.model.dto.UserRequest;
import com.rfm.application.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping
	public ResponseEntity<List<UserDTO>> findAll() {
		return ResponseEntity.ok(userService.findAll());
	}

	@PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> create(@RequestBody UserRequest data) {
        return ResponseEntity.ok(userService.createUser(data));
    }

    @PutMapping("/{idUser}")
    public ResponseEntity<UserDTO> update(
            @PathVariable Long idUser, 
            @RequestBody UserRequest data, 
            Authentication auth) {
        return ResponseEntity.ok(userService.update(idUser, data, auth));
    }
    
	@GetMapping("/{idUser}")
	public ResponseEntity<UserDTO> findById(@PathVariable Long idUser) {
		return ResponseEntity.ok(userService.findById(idUser));
	}
	
	@GetMapping("/username/{username}")
	public ResponseEntity<UserDTO> findById(@PathVariable String username) {
		return ResponseEntity.ok(userService.findByUserName(username));
	}
	
    @PostMapping(value = "/{idUser}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO> uploadImage(
            @PathVariable Long idUser,
            @RequestPart("image") MultipartFile image) {
        return ResponseEntity.ok(userService.uploadProfileImage(idUser, image));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordDTO forgotPasswordDTO) throws MessagingException, IOException {
        userService.forgotPassword(forgotPasswordDTO);
        return ResponseEntity.ok("Temporary password sent to your email.");
    }
}