package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rfm.application.model.dto.ActivityCommentDTO;
import com.rfm.application.model.dto.ActivityCommentRequest;
import com.rfm.application.model.dto.TaskCommentDTO;
import com.rfm.application.model.dto.TaskCommentRequest;
import com.rfm.application.model.entity.ActivityComment;
import com.rfm.application.model.entity.TaskComment;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.ActivityCommentRepository;
import com.rfm.application.repository.TaskCommentRepository;
import com.rfm.application.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final UserRepository userRepository; 
    
    @Transactional
    public TaskCommentDTO create(TaskCommentRequest request) {
        TaskComment comment = TaskComment.builder()
                .content(request.content())
                .createdAt(LocalDateTime.now())
                .idTask(request.idTask())
                .idUser(request.idUser())
                .build();

        return mapToDTO(commentRepository.save(comment));
    }

    public List<TaskCommentDTO> findAllByTaskComment(Long idTask) {
        return commentRepository.findByIdTaskOrderByCreatedAtDesc(idTask)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional
    public void delete(Long idComment, Long idUser) {
        TaskComment comment = commentRepository.findById(idComment)
                .orElseThrow(() -> new RuntimeException("Comment not found with ID: " + idComment));

        if (!comment.getIdUser().equals(idUser)) {
            throw new RuntimeException("Access denied: You are not allowed to delete a comment that does not belong to you.");
        }

        commentRepository.delete(comment);
    }

    private TaskCommentDTO mapToDTO(TaskComment c) {
        String username = userRepository.findById(c.getIdUser())
                .map(User::getUsername)
                .orElse("Unknown User");

        return TaskCommentDTO.builder()
                .idComment(c.getIdComment())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .idTask(c.getIdTask())
                .idUser(c.getIdUser())
                .username(username)
                .build();
    }
}
