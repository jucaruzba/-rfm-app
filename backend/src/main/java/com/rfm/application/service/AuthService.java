package com.rfm.application.service;

import com.rfm.application.model.dto.AuthenticationRequest;
import com.rfm.application.model.dto.AuthenticationResponse;
import com.rfm.application.model.dto.SessionResponse;
import com.rfm.application.model.dto.UserDTO;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.UserRepository;
import com.rfm.application.security.config.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository repository;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;

	public AuthenticationResponse authenticate(AuthenticationRequest request) {
		authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
		var user = repository.findByUsername(request.getUsername()).orElseThrow();
		var jwtToken = jwtService.generateToken(user);
		return AuthenticationResponse.builder().token(jwtToken).build();
	}

	public SessionResponse validateTokenAndGetUser(String authHeader) {
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			return new SessionResponse(false, null, null);
		}

		String token = authHeader.substring(7);
		String username = jwtService.extractUsername(token);

		User user = repository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

		UserDTO userDto = UserDTO.builder().id(user.getId()).username(user.getUsername()).email(user.getEmail())
				.colorCode(user.getColorCode()).profilePicturePath(user.getProfilePicturePath())
				.role(user.getRole().name()).build();

		return new SessionResponse(true, token, userDto);
	}
}