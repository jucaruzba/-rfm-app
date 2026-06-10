package com.rfm.application.enums;

public enum CompanyStatus {
    ACTIVE("Active"),
    IN_PROGRESS("In Progress"),
    ON_HOLD("On Hold"),
    ARCHIVED("Archived");

    private final String displayName;

    CompanyStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}