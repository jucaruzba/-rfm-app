package com.rfm.application.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rfm.application.model.dto.ActivityCommentDTO;
import com.rfm.application.model.dto.ActivityCommentRequest;
import com.rfm.application.model.dto.TaskCommentDTO;
import com.rfm.application.model.dto.TaskCommentRequest;
import com.rfm.application.service.ActivityCommentService;
import com.rfm.application.service.TaskCommentService;

import lombok.RequiredArgsConstructor;
@RestController
@RequestMapping("/api/v1/commentsdd")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService commentService;

    @PostMapping("/task")
    public ResponseEntity<TaskCommentDTO> create(@RequestBody TaskCommentRequest request) {
        return ResponseEntity.ok(commentService.create(request));
    }

    @GetMapping("/task/{idTask}")
    public ResponseEntity<List<TaskCommentDTO>> getByTask(@PathVariable Long idTask) {
        return ResponseEntity.ok(commentService.findAllByTaskComment(idTask));
    }

    @DeleteMapping("/{idComment}")
    public ResponseEntity<Void> delete(
            @PathVariable Long idComment,
            @RequestParam Long idUser) {
        commentService.delete(idComment, idUser);
        return ResponseEntity.noContent().build();
    }
}