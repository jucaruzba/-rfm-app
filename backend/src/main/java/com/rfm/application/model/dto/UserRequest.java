package com.rfm.application.model.dto;

import com.rfm.application.enums.Role;

import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String password;
    private String email;
    private String colorCode;
    private Role role;
}