package com.rfm.application.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.rfm.application.enums.CompanyStatus;
import com.rfm.application.enums.CompanyType;
import com.rfm.application.enums.LeadStatus;
import com.rfm.application.model.dto.CompanyDTO;
import com.rfm.application.model.dto.CompanyRequest;
import com.rfm.application.model.dto.LeadActivityLogDTO;
import com.rfm.application.model.dto.LeadDTO;
import com.rfm.application.model.dto.LeadRequest;
import com.rfm.application.model.dto.LeadStageUpdateRequest;
import com.rfm.application.model.dto.TaskRequest;
import com.rfm.application.model.entity.Company;
import com.rfm.application.model.entity.Lead;
import com.rfm.application.model.entity.LeadActivityLog;
import com.rfm.application.repository.CompanyRepository;
import com.rfm.application.repository.LeadActivityLogRepository;
import com.rfm.application.repository.LeadRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadActivityLogRepository logRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final TaskService taskService;

    public List<LeadDTO> getActivePipelineLeads() {
        return leadRepository.findAllActivePipelineLeads().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<LeadDTO> getAllLeads() {
        return leadRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    public LeadDTO getLeadById(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));
        return mapToDTO(lead);
    }

    @Transactional
    public LeadDTO createLead(LeadRequest request) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Lead name is required");
        }
        if (request.nextFollowUp() == null) {
            throw new IllegalArgumentException("Next follow-up date is required");
        }

        Lead lead = Lead.builder()
                .name(request.name().trim())
                .companyName(request.companyName() != null && !request.companyName().trim().isEmpty() ? request.companyName().trim() : null)
                .phoneOrEmail(request.phoneOrEmail())
                .value(request.value())
                .source(request.source())
                .sourceOther(request.sourceOther())
                .notes(request.notes())
                .nextFollowUp(request.nextFollowUp())
                .status(request.status() != null ? request.status() : LeadStatus.NEW)
                .build();

        Lead savedLead = leadRepository.save(lead);

        // Create initial log
        createLog(savedLead.getIdLead(), null, savedLead.getStatus(), "Lead created", savedLead.getNextFollowUp());

        log.info("Lead created successfully with ID: {} and status: {}", savedLead.getIdLead(), savedLead.getStatus());
        return mapToDTO(savedLead);
    }

    @Transactional
    public LeadDTO updateLead(Long id, LeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        if (request.name() != null && !request.name().trim().isEmpty()) {
            lead.setName(request.name().trim());
        }
        lead.setCompanyName(request.companyName());
        lead.setPhoneOrEmail(request.phoneOrEmail());
        lead.setValue(request.value());
        lead.setSource(request.source());
        lead.setSourceOther(request.sourceOther());
        lead.setNotes(request.notes());
        if (request.nextFollowUp() != null) {
            lead.setNextFollowUp(request.nextFollowUp());
        }
        if (request.status() != null && request.status() != lead.getStatus()) {
            LeadStatus oldStatus = lead.getStatus();
            lead.setStatus(request.status());
            createLog(lead.getIdLead(), oldStatus, lead.getStatus(), "Status updated directly", lead.getNextFollowUp());
        }

        Lead updated = leadRepository.save(lead);
        log.info("Lead {} updated successfully", id);
        return mapToDTO(updated);
    }

    @Transactional
    public LeadDTO changeStage(Long id, LeadStageUpdateRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        if (request.nextFollowUp() == null) {
            throw new IllegalArgumentException("Next follow-up date is required when changing stage");
        }

        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(request.newStatus());
        lead.setNextFollowUp(request.nextFollowUp());

        Lead savedLead = leadRepository.save(lead);

        String note = (request.note() != null && !request.note().trim().isEmpty()) ? request.note().trim() : "Stage changed to " + request.newStatus().getDisplayName();
        createLog(savedLead.getIdLead(), oldStatus, request.newStatus(), note, request.nextFollowUp());

        log.info("Lead {} changed stage from {} to {}", id, oldStatus, request.newStatus());
        return mapToDTO(savedLead);
    }

    @Transactional
    public LeadDTO markAsWon(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(LeadStatus.WON);

        // Determine company name: either the companyName field or the lead name itself
        String effectiveCompanyName = (lead.getCompanyName() != null && !lead.getCompanyName().trim().isEmpty())
                ? lead.getCompanyName().trim()
                : lead.getName().trim() + " Company";

        // Check if company already exists
        Company company = companyRepository.findByNameIgnoreCase(effectiveCompanyName).orElse(null);

        if (company == null) {
            // Create new Company
            CompanyRequest companyRequest = new CompanyRequest(
                    effectiveCompanyName,
                    "Client created from Pipeline lead: " + lead.getName(),
                    CompanyType.CLIENT,
                    CompanyStatus.IN_PROGRESS,
                    null
            );
            CompanyDTO createdCompany = companyService.create(companyRequest);
            company = companyRepository.findById(createdCompany.getIdCompany())
                    .orElseThrow(() -> new RuntimeException("Failed to load newly created company"));
        } else {
            // Update existing company to CLIENT and IN_PROGRESS if not already
            company.setType(CompanyType.CLIENT);
            company.setStatus(CompanyStatus.IN_PROGRESS);
            company = companyRepository.save(company);
        }

        lead.setIdCompany(company.getIdCompany());
        Lead savedLead = leadRepository.save(lead);

        // Create log
        createLog(savedLead.getIdLead(), oldStatus, LeadStatus.WON, "Marked as Won. Converted to Client company: " + company.getName(), lead.getNextFollowUp());

        // Attach Onboarding 5-step Checklist
        attachOnboardingChecklist(company.getIdCompany(), company.getName());

        log.info("Lead {} marked as WON. Converted to Company ID {} with onboarding checklist", id, company.getIdCompany());
        return mapToDTO(savedLead);
    }

    @Transactional
    public LeadDTO markAsLost(Long id, String reason) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(LeadStatus.CLOSED_LOST);

        Lead savedLead = leadRepository.save(lead);

        String note = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Marked as closed-lost (Not moving forward)";
        createLog(savedLead.getIdLead(), oldStatus, LeadStatus.CLOSED_LOST, note, lead.getNextFollowUp());

        log.info("Lead {} marked as CLOSED_LOST", id);
        return mapToDTO(savedLead);
    }

    @Transactional
    public void deleteLead(Long id) {
        logRepository.deleteByIdLead(id);
        leadRepository.deleteById(id);
        log.info("Lead {} deleted permanently", id);
    }

    private void attachOnboardingChecklist(Long companyId, String companyName) {
        List<String> checklistTitles = List.of(
                "Send contract",
                "Contract signed",
                "Send welcome info",
                "Set up first deliverable",
                "Kickoff call"
        );

        LocalDate today = LocalDate.now();

        for (int i = 0; i < checklistTitles.size(); i++) {
            String title = checklistTitles.get(i);
            TaskRequest taskRequest = new TaskRequest(
                    title,
                    "Client onboarding checklist item for " + companyName + " (Step " + (i + 1) + " of 5)",
                    today.plusDays(i),
                    today.plusDays(i + 1),
                    companyId,
                    "ONBOARDING", // Marker used to recognize onboarding tasks
                    null,
                    "PENDING",
                    null,
                    null,
                    "NORMAL"
            );
            try {
                taskService.create(taskRequest);
            } catch (Exception e) {
                log.error("Error creating onboarding task '{}' for company {}: {}", title, companyId, e.getMessage());
            }
        }
    }

    private void createLog(Long leadId, LeadStatus fromStatus, LeadStatus toStatus, String note, LocalDate nextFollowUp) {
        String username = "System";
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isBlank()) {
                username = auth.getName();
            }
        } catch (Exception ignored) {}

        LeadActivityLog activityLog = LeadActivityLog.builder()
                .idLead(leadId)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .note(note)
                .nextFollowUp(nextFollowUp)
                .createdByUser(username)
                .build();

        logRepository.save(activityLog);
    }

    private LeadDTO mapToDTO(Lead lead) {
        List<LeadActivityLogDTO> logs = logRepository.findByIdLeadOrderByCreatedAtDesc(lead.getIdLead())
                .stream()
                .map(log -> LeadActivityLogDTO.builder()
                        .idLog(log.getIdLog())
                        .idLead(log.getIdLead())
                        .fromStatus(log.getFromStatus())
                        .toStatus(log.getToStatus())
                        .note(log.getNote())
                        .nextFollowUp(log.getNextFollowUp())
                        .createdByUser(log.getCreatedByUser())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();

        return LeadDTO.builder()
                .idLead(lead.getIdLead())
                .name(lead.getName())
                .companyName(lead.getCompanyName())
                .idCompany(lead.getIdCompany())
                .phoneOrEmail(lead.getPhoneOrEmail())
                .value(lead.getValue())
                .source(lead.getSource())
                .sourceOther(lead.getSourceOther())
                .notes(lead.getNotes())
                .nextFollowUp(lead.getNextFollowUp())
                .status(lead.getStatus())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .activityLogs(logs)
                .build();
    }
}
