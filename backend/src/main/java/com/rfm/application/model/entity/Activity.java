package com.rfm.application.model.entity;


import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "activities")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_activity")
    private Long idActivity;

    private String title;
    private String description;

    @Column(name = "event_date")
    private LocalDateTime eventDate;

    @Column(name = "id_company")
    private Long idCompany;

    @Column(name = "external_reference_name")
    private String externalReferenceName;

    @Column(name = "id_node")
    private Long idNode;
}