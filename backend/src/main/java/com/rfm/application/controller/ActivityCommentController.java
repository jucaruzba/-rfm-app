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
import com.rfm.application.model.dto.LeadCommentDTO;
import com.rfm.application.model.dto.LeadCommentRequest;
import com.rfm.application.model.dto.TaskCommentDTO;
import com.rfm.application.model.dto.TaskCommentRequest;
import com.rfm.application.service.ActivityCommentService;
import com.rfm.application.service.LeadCommentService;
import com.rfm.application.service.TaskCommentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class ActivityCommentController {

    private final ActivityCommentService commentService;
    private final TaskCommentService commentTaskService;
    private final LeadCommentService leadCommentService;

    @PostMapping
    public ResponseEntity<ActivityCommentDTO> create(@RequestBody ActivityCommentRequest request) {
        return ResponseEntity.ok(commentService.create(request));
    }

    @GetMapping("/activity/{idActivity}")
    public ResponseEntity<List<ActivityCommentDTO>> getByActivity(@PathVariable Long idActivity) {
        return ResponseEntity.ok(commentService.findAllByActivity(idActivity));
    }

    @DeleteMapping("/{idComment}")
    public ResponseEntity<Void> delete(
            @PathVariable Long idComment, 
            @RequestParam Long idUser) {
        commentService.delete(idComment, idUser);
        return ResponseEntity.noContent().build();
    }
    

    @PostMapping("/task")
    public ResponseEntity<TaskCommentDTO> create(@RequestBody TaskCommentRequest request) {
        return ResponseEntity.ok(commentTaskService.create(request));
    }

    @GetMapping("/task/{idTask}")
    public ResponseEntity<List<TaskCommentDTO>> getByTask(@PathVariable Long idTask) {
        return ResponseEntity.ok(commentTaskService.findAllByTaskComment(idTask));
    }

    @DeleteMapping("/task/{idComment}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long idComment,
            @RequestParam Long idUser) {
    	commentTaskService.delete(idComment, idUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/lead")
    public ResponseEntity<LeadCommentDTO> createLeadComment(@RequestBody LeadCommentRequest request) {
        return ResponseEntity.ok(leadCommentService.create(request));
    }

    @GetMapping("/lead/{idLead}")
    public ResponseEntity<List<LeadCommentDTO>> getByLead(@PathVariable Long idLead) {
        return ResponseEntity.ok(leadCommentService.findAllByLead(idLead));
    }

    @DeleteMapping("/lead/{idComment}")
    public ResponseEntity<Void> deleteLeadComment(
            @PathVariable Long idComment,
            @RequestParam Long idUser) {
        leadCommentService.delete(idComment, idUser);
        return ResponseEntity.noContent().build();
    }
}
