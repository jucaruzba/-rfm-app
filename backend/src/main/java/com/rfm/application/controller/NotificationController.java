package com.rfm.application.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.rfm.application.model.dto.NotificationDTO;
import com.rfm.application.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{idUser}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long idUser) {
        return ResponseEntity.ok(notificationService.findByUser(idUser));
    }

    @GetMapping("/user/{idUser}/paginated")
    public ResponseEntity<Page<NotificationDTO>> getUserNotificationsPaginated(
            @PathVariable Long idUser,
            @PageableDefault(page = 0, size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(notificationService.findByUserPaginated(idUser, pageable));
    }

    @GetMapping("/user/{idUser}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@PathVariable Long idUser) {
        return ResponseEntity.ok(notificationService.findUnreadByUser(idUser));
    }

    @GetMapping("/{idNotification}")
    public ResponseEntity<NotificationDTO> getNotification(@PathVariable Long idNotification) {
        return ResponseEntity.ok(notificationService.findById(idNotification));
    }

    @PutMapping("/{idNotification}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long idNotification) {
        return ResponseEntity.ok(notificationService.markAsRead(idNotification));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Map<String, String>> markMultipleAsRead(@RequestBody List<Long> idNotifications) {
        notificationService.markMultipleAsRead(idNotifications);
        return ResponseEntity.ok(Map.of("message", "Notifications marked as read"));
    }

    @DeleteMapping("/{idNotification}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long idNotification) {
        notificationService.delete(idNotification);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}
