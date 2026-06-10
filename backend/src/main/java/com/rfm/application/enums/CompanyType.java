package com.rfm.application.enums;

public enum CompanyType {
    MY_BUSINESS("My Business"),
    CLIENT("Client"),
    PARTNERSHIP("Partnership"),
    PERSONAL("Personal");

    private final String displayName;

    CompanyType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}