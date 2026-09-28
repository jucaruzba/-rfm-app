package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rfm.application.model.dto.LeadCommentDTO;
import com.rfm.application.model.dto.LeadCommentRequest;
import com.rfm.application.model.entity.LeadComment;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.LeadCommentRepository;
import com.rfm.application.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LeadCommentService {

    private final LeadCommentRepository commentRepository;
    private final UserRepository userRepository;

    @Transactional
    public LeadCommentDTO create(LeadCommentRequest request) {
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content is required");
        }
        LeadComment comment = LeadComment.builder()
                .content(request.content().trim())
                .createdAt(LocalDateTime.now())
                .idLead(request.idLead())
                .idUser(request.idUser())
                .build();
        return mapToDTO(commentRepository.save(comment));
    }

    public List<LeadCommentDTO> findAllByLead(Long idLead) {
        return commentRepository.findByIdLeadOrderByCreatedAtDesc(idLead)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public void delete(Long idComment, Long idUser) {
        LeadComment comment = commentRepository.findById(idComment)
                .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + idComment));

        if (!comment.getIdUser().equals(idUser)) {
            throw new RuntimeException("Access denied: You are not allowed to delete a comment that does not belong to you.");
        }

        commentRepository.delete(comment);
    }

    private LeadCommentDTO mapToDTO(LeadComment c) {
        String username = userRepository.findById(c.getIdUser())
                .map(User::getUsername)
                .orElse("Unknown User");

        return LeadCommentDTO.builder()
                .idComment(c.getIdComment())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .idLead(c.getIdLead())
                .idUser(c.getIdUser())
                .username(username)
                .build();
    }
}
