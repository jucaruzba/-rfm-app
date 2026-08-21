package com.rfm.application.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.rfm.application.enums.RepeatType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_task")
    private Long idTask;

    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    private String status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "id_company")
    private Long idCompany;

    @Column(name = "external_reference_name")
    private String externalReferenceName;

    @Column(name = "id_user_assigned")
    private Long idUserAssigned;

    @Column(name = "id_node")
    private Long idNode;

    @Enumerated(EnumType.STRING)
    @Column(name = "repeat_type")
    private RepeatType repeatType;

    @Column(name = "repeat_end_date")
    private LocalDate repeatEndDate;

    @Column(name = "parent_task_id")
    private Long parentTaskId;

    @Column(name = "priority")
    private String priority;
}
