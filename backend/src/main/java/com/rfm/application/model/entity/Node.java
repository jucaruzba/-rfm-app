package com.rfm.application.model.entity;

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
@Table(name = "nodes")
public class Node {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_node")
    private Long idNode;

    @Column(name="name", unique = true, nullable = false)
    private String name;
    
    @Column(name="description")
    private String description;
    
    @Column(name="node_type")
    private String nodeType;
    
    @Column(name="real_path")
    private String realPath;
    
    @Column(name="id_parent")
    private Long idParent;
    
    @Column(name="id_company")
    private Long idCompany;
    

}
