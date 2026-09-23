package com.rfm.application.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.rfm.application.enums.LeadStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lead_activity_logs")
public class LeadActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    @Column(name = "id_lead", nullable = false)
    private Long idLead;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private LeadStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 30, nullable = false)
    private LeadStatus toStatus;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "next_follow_up")
    private LocalDate nextFollowUp;

    @Column(name = "created_by_user")
    private String createdByUser;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
