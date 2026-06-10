package com.rfm.application.model.dto;

public record SessionResponse(boolean status, String token, UserDTO user) {}