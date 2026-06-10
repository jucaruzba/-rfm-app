package com.rfm.application.model.dto;

public record CreateFolderDTO (
		Long idParent, String folderName, String description,
		Long idCompany){}
