package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.PendingItemDTO;
import com.rfm.application.model.dto.PendingItemRequest;
import com.rfm.application.model.entity.PendingItem;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.PendingItemRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PendingItemService {

	private final PendingItemRepository pendingItemRepository;
	private final SimpMessagingTemplate messagingTemplate;
	private final NotificationService notificationService;
	private final UserRepository userRepository;

	@Transactional
	public PendingItemDTO create(PendingItemRequest request) {
		String status = request.status() == null ? "PENDING" : request.status();

		PendingItem p = PendingItem.builder().title(request.title()).description(request.description()).status(status)
				.createdBy(request.createdBy()).assignedTo(request.assignedTo()).referenceType(request.referenceType())
				.referenceId(request.referenceId()).createdAt(LocalDateTime.now()).build();

		PendingItem saved = pendingItemRepository.save(p);

		if ("PENDING".equalsIgnoreCase(saved.getStatus())) {
			messagingTemplate.convertAndSend("/topic/pending", mapToDTO(saved));
		}

		if (saved.getAssignedTo() != null) {
			notificationService.create(saved.getAssignedTo(), "New pending item assigned",
					"You have been assigned the pending item: " + saved.getTitle(), "pending", saved.getIdPending());
		}

		return mapToDTO(saved);
	}

	@Transactional
	public PendingItemDTO update(Long id, PendingItemRequest request) {
		PendingItem p = pendingItemRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("PendingItem not found"));

		boolean userAssignmentChanged = !java.util.Objects.equals(p.getAssignedTo(), request.assignedTo());

		p.setTitle(request.title());
		p.setDescription(request.description());
		p.setStatus(request.status());
		p.setCreatedBy(request.createdBy());
		p.setAssignedTo(request.assignedTo());
		p.setReferenceType(request.referenceType());
		p.setReferenceId(request.referenceId());
		p.setUpdatedAt(LocalDateTime.now());

		PendingItem saved = pendingItemRepository.save(p);

		if ("PENDING".equalsIgnoreCase(saved.getStatus())) {
			messagingTemplate.convertAndSend("/topic/pending", mapToDTO(saved));
		} else {
			messagingTemplate.convertAndSend("/topic/pending",
					Map.of("action", "remove", "idPending", saved.getIdPending()));
		}

		if (userAssignmentChanged && request.assignedTo() != null) {
			notificationService.create(request.assignedTo(), "Pending item assigned",
					"You have been assigned the pending item: " + saved.getTitle(), "pending", saved.getIdPending());
		}

		return mapToDTO(saved);
	}

	@Transactional
	public void delete(Long id) {
		PendingItem p = pendingItemRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("PendingItem not found"));
		pendingItemRepository.delete(p);
		messagingTemplate.convertAndSend("/topic/pending", Map.of("action", "remove", "idPending", id));
	}

	public PendingItemDTO findById(Long id) {
		return pendingItemRepository.findById(id).map(this::mapToDTO)
				.orElseThrow(() -> new RuntimeException("PendingItem not found"));
	}

	public List<PendingItemDTO> findByIdReference(Long idReference) {
		List<PendingItem> pendingItems = pendingItemRepository.findByReferenceId(idReference);
		if (pendingItems.isEmpty()) {
			throw new RuntimeException("No PendingItems found with referenceId: " + idReference);
		}
		return pendingItems.stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	public Page<PendingItemDTO> search(String status, Long createdBy, Long assignedTo, String referenceType,
			Pageable pageable) {
		Page<PendingItem> page = pendingItemRepository.findWithFilters(status, createdBy, assignedTo, referenceType,
				pageable);
		return page.map(this::mapToDTO);
	}

	public List<PendingItemDTO> searchList(String status, Long createdBy, Long assignedTo, String referenceType) {
		List<PendingItem> list = pendingItemRepository.findFilters(status, createdBy, assignedTo, referenceType);
		return list.stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	private PendingItemDTO mapToDTO(PendingItem p) {
		String createdUserName = null;
		if (p.getCreatedBy() != null) {
			createdUserName = userRepository.findById(p.getCreatedBy()).map(User::getUsername).orElse(null);
		}

		return new PendingItemDTO(p.getIdPending(), p.getTitle(), p.getDescription(), p.getStatus(), p.getCreatedBy(),
				createdUserName, p.getAssignedTo(), p.getReferenceType(), p.getReferenceId(), p.getCreatedAt(),
				p.getUpdatedAt());
	}
}