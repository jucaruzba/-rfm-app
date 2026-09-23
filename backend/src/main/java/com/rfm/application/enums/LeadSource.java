package com.rfm.application.enums;

public enum LeadSource {
    REFERRAL("Referral"),
    INSTAGRAM("Instagram"),
    WEBSITE("Website"),
    WALK_IN("Walk-in"),
    OTHER("Other");

    private final String displayName;

    LeadSource(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
