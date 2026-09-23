package com.rfm.application.enums;

public enum LeadStatus {
    NEW("new"),
    CONTACTED("contacted"),
    QUOTED("quoted"),
    CLOSED_LOST("closed-lost"),
    WON("won");

    private final String displayName;

    LeadStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
