package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rfm.application.model.dto.ActivityCommentDTO;
import com.rfm.application.model.dto.ActivityCommentRequest;
import com.rfm.application.model.entity.ActivityComment;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.ActivityCommentRepository;
import com.rfm.application.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityCommentService {

    private final ActivityCommentRepository commentRepository;
    private final UserRepository userRepository; // Inyectamos para buscar el username

    @Transactional
    public ActivityCommentDTO create(ActivityCommentRequest request) {
        ActivityComment comment = ActivityComment.builder()
                .content(request.content())
                .createdAt(LocalDateTime.now())
                .idActivity(request.idActivity())
                .idUser(request.idUser())
                .build();

        return mapToDTO(commentRepository.save(comment));
    }

    public List<ActivityCommentDTO> findAllByActivity(Long idActivity) {
        return commentRepository.findByIdActivityOrderByCreatedAtDesc(idActivity)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public void delete(Long idComment, Long idUser) {
        ActivityComment comment = commentRepository.findById(idComment)
                .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + idComment));

        if (!comment.getIdUser().equals(idUser)) {
            throw new RuntimeException("Access denied: You are not allowed to delete a comment that does not belong to you.");
        }

        commentRepository.delete(comment);
    }

    private ActivityCommentDTO mapToDTO(ActivityComment c) {
        // Buscamos el usuario por ID para obtener su username
        String username = userRepository.findById(c.getIdUser())
                .map(User::getUsername)
                .orElse("Unknown User");

        return ActivityCommentDTO.builder()
                .idComment(c.getIdComment())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .idActivity(c.getIdActivity())
                .idUser(c.getIdUser())
                .username(username) // Mapeamos el nombre encontrado
                .build();
    }
}