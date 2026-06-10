package com.rfm.application.model.dto;

import com.rfm.application.enums.Role;
import com.rfm.application.model.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailDTO {
    
    private String correoDestinatario;
    
    private String asunto;
    
    private String mensajeHtml;
    

}