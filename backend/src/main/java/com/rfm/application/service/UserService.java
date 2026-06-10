package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.rfm.application.email.service.NotificacionCorreoService;
import com.rfm.application.enums.Role;
import com.rfm.application.model.dto.EmailDTO;
import com.rfm.application.model.dto.ForgotPasswordDTO;
import com.rfm.application.model.dto.UserDTO;
import com.rfm.application.model.dto.UserRequest;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.UserRepository;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

	@Value("${project.storage.default-profile-image}")
	private String defaultImagePath;

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final FileStorageService fileStorageService;
	private final NotificacionCorreoService emailService;

	// CONSULTAS
	public List<UserDTO> findAll() {
		return userRepository.findAll().stream().map(this::mapToDTO).toList();
	}
	
	public UserDTO findByUserName(String username) {
		return userRepository.findByUsername(username).map(this::mapToDTO).orElseThrow();
	}

	public UserDTO findById(Long id) {
		return userRepository.findById(id).map(this::mapToDTO).orElseThrow();
	}

	public UserDTO createUser(UserRequest request) {
		User user = User.builder().username(request.getUsername())
				.password(passwordEncoder.encode(request.getPassword())).email(request.getEmail())
				.colorCode(request.getColorCode()).role(request.getRole()).profilePicturePath(defaultImagePath).build();

		return mapToDTO(userRepository.save(user));
	}

	public UserDTO update(Long id, UserRequest request, Authentication auth) {
		User userToEdit = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

		User currentUser = (User) auth.getPrincipal();
		if (currentUser.getRole() != Role.ADMIN && !userToEdit.getId().equals(currentUser.getId())) {
			throw new RuntimeException("You do not have permission to edit this profile");
		}

		userToEdit.setUsername(request.getUsername());
		userToEdit.setEmail(request.getEmail());
		userToEdit.setColorCode(request.getColorCode());

		if (request.getPassword() != null && !request.getPassword().isBlank()) {
			userToEdit.setPassword(passwordEncoder.encode(request.getPassword()));
		}
		if (currentUser.getRole() == Role.ADMIN && request.getRole() != null) {
			userToEdit.setRole(request.getRole());
		}

		return mapToDTO(userRepository.save(userToEdit));
	}

	public UserDTO mapToDTO(User user) {
		return UserDTO.builder().id(user.getId()).username(user.getUsername()).email(user.getEmail())
				.colorCode(user.getColorCode()).profilePicturePath(user.getProfilePicturePath())
				.role(user.getRole().name()).build();
	}

	public UserDTO uploadProfileImage(Long idUser, MultipartFile file) {
		User user = userRepository.findById(idUser).orElseThrow(() -> new RuntimeException("User not found"));
		String currentPath = user.getProfilePicturePath();
		if (currentPath != null && !currentPath.equals(defaultImagePath)) {
			try {
				Files.deleteIfExists(Paths.get(currentPath));
			} catch (IOException e) {
			}
		}
		String newPath = fileStorageService.saveFile(file, "profiles");
		user.setProfilePicturePath(newPath);
		return mapToDTO(userRepository.save(user));
	}

	public void forgotPassword(ForgotPasswordDTO forgotPasswordDTO) throws MessagingException, IOException {
	    User user = userRepository.findByEmail(forgotPasswordDTO.email())
	            .orElseThrow(() -> new RuntimeException("User not found"));

	    String tempPass = UUID.randomUUID().toString().substring(0, 8);
	    user.setPassword(passwordEncoder.encode(tempPass));
	    userRepository.save(user);
	    
	    Map<String, Object> variables = new HashMap<>();
	    variables.put("username", user.getUsername());
	    variables.put("tempPass", tempPass);
	    
	    String html = emailService.processTemplate("email/forgot-password", variables);

	    EmailDTO emailDto = EmailDTO.builder()
	            .correoDestinatario(user.getEmail())
	            .asunto("RFM System - Temporary Password")
	            .mensajeHtml(html)
	            .build();

	    emailService.envioPassNueva(emailDto);
	}
}