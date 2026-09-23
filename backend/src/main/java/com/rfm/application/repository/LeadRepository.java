package com.rfm.application.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rfm.application.enums.LeadStatus;
import com.rfm.application.model.entity.Lead;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByStatus(LeadStatus status);

    List<Lead> findByStatusNot(LeadStatus status);

    @Query("SELECT l FROM Lead l WHERE l.status <> com.rfm.application.enums.LeadStatus.WON ORDER BY l.nextFollowUp ASC, l.createdAt DESC")
    List<Lead> findAllActivePipelineLeads();

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status = com.rfm.application.enums.LeadStatus.CLOSED_LOST")
    long countClosedLost();

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status <> com.rfm.application.enums.LeadStatus.WON AND l.status <> com.rfm.application.enums.LeadStatus.CLOSED_LOST AND l.nextFollowUp = :date")
    long countDueOn(LocalDate date);
}
